import { spawn } from "child_process";
import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";
import { $ } from "zx";
import { Action, ActionType, registerAction } from "../actions.mts";
import * as logger from "../logger.mts";

const TRANSCRIPTIONS_DIR = path.join(
  os.homedir(),
  "contexts-data",
  "transcriptions",
);
const TEMP_DIR = "/tmp";
const RECORDING_DELAY_MS = 1500;
const EMACS_DAEMON_NAME = "transcriptions";

let isRecording = false;
let isTranscribing = false;
let recordingProcess: any = null;
let isVoiceCommandsActive = false;
let voiceCommandsProcess: any = null;

// Utility functions
function generateTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
}

function generateFilePaths(timestamp: string) {
  const filename = `${timestamp}.txt`;
  const filepath = path.join(TRANSCRIPTIONS_DIR, filename);
  const tempAudioFile = path.join(TEMP_DIR, `voice-recording-${timestamp}.wav`);
  const tempTranscriptionFile = path.join(
    TEMP_DIR,
    `voice-recording-${timestamp}.txt`,
  );

  return { filepath, tempAudioFile, tempTranscriptionFile };
}

async function startEmacsDaemon(): Promise<void> {
  try {
    await $`emacsclient -s ${EMACS_DAEMON_NAME} --eval "(message \\"daemon running\\")"`;
  } catch (error) {
    try {
      const daemon = spawn("emacs", [`--daemon=${EMACS_DAEMON_NAME}`], {
        detached: true,
        stdio: "ignore",
      });
      daemon.unref();
    } catch (spawnError) {
      logger.error("Failed to start Emacs daemon", { error: spawnError });
    }
  }
}

async function openInEmacs(filepath: string): Promise<void> {
  try {
    await $`emacsclient -s ${EMACS_DAEMON_NAME} --eval "(message \\"daemon ready\\")"`;
    const child = spawn(
      "/usr/bin/emacsclient",
      ["-c", "-s", EMACS_DAEMON_NAME, filepath],
      { detached: true, stdio: "ignore" },
    );
    child.unref();
  } catch (daemonError) {
    logger.error("Emacs daemon not ready", { error: daemonError });
    await $`notify-send "Emacs daemon not ready - transcription saved to ${filepath}"`;
  }
}

async function stopRecording(): Promise<void> {
  if (!recordingProcess) return;

  await new Promise((resolve) => setTimeout(resolve, RECORDING_DELAY_MS));
  recordingProcess.kill("SIGTERM");
}

async function startRecording(tempAudioFile: string): Promise<void> {
  isRecording = true;
  await $`notify-send "Recording"`;

  recordingProcess = spawn(
    "parecord",
    [
      "--format=s16le",
      "--rate=16000",
      "--channels=1",
      "--file-format=wav",
      tempAudioFile,
    ],
    {
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}

async function transcribeAudio(tempAudioFile: string): Promise<void> {
  isTranscribing = true;
  await $`notify-send "Transcribing"`;

  const whisperProcess = spawn(
    "whisper-ctranslate2",
    [
      "--model",
      "small",
      "--language",
      "en",
      "--output_format",
      "txt",
      "--output_dir",
      TEMP_DIR,
      tempAudioFile,
    ],
    {
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  let transcription = "";
  let errorOutput = "";

  whisperProcess.stdout.on("data", (data) => {
    transcription += data.toString();
  });

  whisperProcess.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  return new Promise((resolve, reject) => {
    whisperProcess.on("close", (code) => {
      isTranscribing = false;
      if (code !== 0) {
        logger.error("Transcription failed", { code, error: errorOutput });
        $`notify-send "Transcription failed"`;
        reject(new Error(`Transcription failed with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

async function handleTranscriptionResult(
  tempTranscriptionFile: string,
  filepath: string,
): Promise<void> {
  try {
    await fs.copyFile(tempTranscriptionFile, filepath);
    await fs.unlink(tempTranscriptionFile);

    const transcriptionContent = await fs.readFile(filepath, "utf-8");
    if (transcriptionContent.trim()) {
      await $`notify-send ${transcriptionContent.trim()}`;
    }

    await openInEmacs(filepath);
  } catch (fileError) {
    logger.error("Failed to read or move transcription file", {
      error: fileError,
      file: tempTranscriptionFile,
    });
  }
}

async function voiceTranscribeToggle(): Promise<void> {
  try {
    await startEmacsDaemon();

    if (isTranscribing) {
      return;
    }

    if (isRecording) {
      await stopRecording();
      return;
    }

    // Start new recording if not transcribing or already recording
    const timestamp = generateTimestamp();
    const { filepath, tempAudioFile, tempTranscriptionFile } =
      generateFilePaths(timestamp);

    await fs.mkdir(TRANSCRIPTIONS_DIR, { recursive: true });

    await startRecording(tempAudioFile);

    // Wait for recording to complete
    await new Promise<void>((resolve, reject) => {
      recordingProcess.on("close", async (code) => {
        isRecording = false;
        recordingProcess = null;

        if (code !== 0 && code !== null) {
          reject(new Error(`Recording process exited with code ${code}`));
          return;
        }

        try {
          await transcribeAudio(tempAudioFile);
          await handleTranscriptionResult(tempTranscriptionFile, filepath);
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      recordingProcess.on("error", (error) => {
        isRecording = false;
        recordingProcess = null;
        reject(error);
      });
    });
  } catch (error) {
    isRecording = false;
    isTranscribing = false;
    recordingProcess = null;
    logger.error("Voice recording and transcription failed", { error });
    throw error;
  }
}

async function voiceCommandsHelp(): Promise<void> {
  try {
    await $`emacsclient -c -s voice-commands-help --eval '(easysession-switch-to "z-voice-cheat")'`;
  } catch (error) {
    logger.error("Voice commands help failed", { error });
    throw error;
  }
}

async function voiceCommandsToggle(): Promise<void> {
  try {
    if (isVoiceCommandsActive && voiceCommandsProcess) {
      // Kill the existing numen process
      voiceCommandsProcess.kill("SIGTERM");
      isVoiceCommandsActive = false;
      voiceCommandsProcess = null;
      $`notify-send "Voice commands: inactive"`;
      return;
    }

    // Start new numen process
    isVoiceCommandsActive = true;
    voiceCommandsProcess = spawn(
      "numen",
      [
        "--mic",
        "pipewire",
        "--x11",
        "--phraselog=/tmp/numen-phraselog",
        ...(await $`ls ~/.config/numen/phrases/*.phrases`.then((result) =>
          result.stdout.trim().split("\n"),
        )),
      ],
      {
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    voiceCommandsProcess.on("close", (code) => {
      isVoiceCommandsActive = false;
      voiceCommandsProcess = null;
      if (code !== 0 && code !== null) {
        $`notify-send "Voice commands exited with error code ${code}"`;
      }
    });

    voiceCommandsProcess.on("error", (error) => {
      isVoiceCommandsActive = false;
      voiceCommandsProcess = null;
      logger.error("Voice commands process error", { error });
      $`notify-send "Voice commands error: ${error.message}"`;
    });

    $`notify-send "Voice commands: active"`;
  } catch (error) {
    isVoiceCommandsActive = false;
    voiceCommandsProcess = null;
    logger.error("Voice commands failed", { error });
    throw error;
  }
}

export const voiceTranscribeWithWhisperAction: Action = {
  id: "voiceTranscribeToggle",
  name: "Voice Transcribe with Whisper",
  type: ActionType.VOICE,
  handler: voiceTranscribeToggle,
};

export const voiceCommandsToggleAction: Action = {
  id: "voiceCommandsToggle",
  name: "Voice Commands Toggle",
  type: ActionType.VOICE,
  handler: voiceCommandsToggle,
};

export const voiceCommandsHelpAction: Action = {
  id: "voiceCommandsHelp",
  name: "Voice Commands Help",
  type: ActionType.VOICE,
  handler: voiceCommandsHelp,
};

registerAction(voiceTranscribeWithWhisperAction);
registerAction(voiceCommandsToggleAction);
registerAction(voiceCommandsHelpAction);
