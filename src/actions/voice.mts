import { spawn } from "child_process";
import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";
import { Action, ActionType, registerAction } from "../actions.mts";
import * as logger from "../logger.mts";

async function recordAndTranscribe(): Promise<void> {
  try {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5); // Remove milliseconds and replace colons/dots
    const filename = `${timestamp}.txt`;
    const directory = path.join(os.homedir(), "contexts-data", "transcriptions");
    const filepath = path.join(directory, filename);

    await fs.mkdir(directory, { recursive: true });

    logger.debug("Starting voice recording and transcription", { filepath });

    // Record audio for 5 seconds using parecord to a temp path
    const tempAudioFile = path.join("/tmp", `voice-recording-${timestamp}.wav`);

    const recordProcess = spawn("parecord", [
      "--format=s16le",
      "--rate=16000",
      "--channels=1",
      "--file-format=wav",
      tempAudioFile
    ], {
      stdio: ["ignore", "pipe", "pipe"]
    });

    // Stop recording after 5 seconds
    setTimeout(() => {
      recordProcess.kill("SIGTERM");
    }, 5000);

    // Wait for recording to complete
    await new Promise<void>((resolve, reject) => {
      recordProcess.on("close", (code) => {
        if (code !== 0 && code !== null) {
          reject(new Error(`Recording process exited with code ${code}`));
        } else {
          resolve();
        }
      });

      recordProcess.on("error", (error) => {
        reject(error);
      });
    });

    // Now transcribe the recorded audio file using whisper-ctranslate2
    const whisperProcess = spawn("whisper-ctranslate2", [
      "--model", "small",
      "--language", "en", 
      "--output_format", "txt",
      "--output_dir", "/tmp",
      tempAudioFile
    ], {
      stdio: ["ignore", "pipe", "pipe"]
    });

    let transcription = "";
    let errorOutput = "";

    whisperProcess.stdout.on("data", (data) => {
      transcription += data.toString();
      logger.debug(transcription)
    });

    whisperProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

  } catch (error) {
    logger.error("Voice recording and transcription failed", { error });
    throw error;
  }
}

export const voiceRecordAction: Action = {
  id: "voiceRecord",
  name: "Record Voice Snippet",
  type: ActionType.BASE,
  handler: recordAndTranscribe,
};

registerAction(voiceRecordAction);
