import { spawn } from "child_process";
import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";
import { $ } from "zx";
import { Action, ActionType, registerAction } from "../actions.mts";
import * as logger from "../logger.mts";

let isRecording = false;
let isTranscribing = false;
let recordingProcess: any = null;

async function recordOrTranscribe(): Promise<void> {
  try {
    // Check if transcriptions daemon is running, if not start it
    try {
      $`emacsclient -s transcriptions --eval "(message \\"daemon running\\")"`;
    } catch (error) {
      // Daemon not running, start it
      const daemon = spawn("emacs", ["--daemon=transcriptions"], {
        detached: true,
        stdio: "ignore",
      });
      daemon.unref();
    }

    if (isTranscribing) {
      logger.debug("Currently transcribing, please wait...");
      return;
    }

    if (isRecording) {
      // Stop recording and start transcription
      logger.debug("Stopping recording and starting transcription");
      // $`notify-send "Recording stopped"`;
      if (recordingProcess) {
        recordingProcess.kill("SIGTERM");
      }
      return;
    }

    // Start recording
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5); // Remove milliseconds and replace colons/dots
    const filename = `${timestamp}.txt`;
    const directory = path.join(os.homedir(), "contexts-data", "transcriptions");
    const filepath = path.join(directory, filename);

    await fs.mkdir(directory, { recursive: true });

    logger.debug("Starting voice recording", { filepath });

    // Record audio using parecord to a temp path
    const tempAudioFile = path.join("/tmp", `voice-recording-${timestamp}.wav`);

    isRecording = true;
    $`notify-send "Recording"`;
    recordingProcess = spawn("parecord", [
      "--format=s16le",
      "--rate=16000",
      "--channels=1",
      "--file-format=wav",
      tempAudioFile
    ], {
      stdio: ["ignore", "pipe", "pipe"]
    });

    // Wait for recording to complete
    await new Promise<void>((resolve, reject) => {
      recordingProcess.on("close", async (code) => {
        isRecording = false;
        recordingProcess = null;
        
        if (code !== 0 && code !== null) {
          reject(new Error(`Recording process exited with code ${code}`));
        } else {
          // Start transcription
          isTranscribing = true;
          logger.debug("Starting transcription with whisper-ctranslate2");
          $`notify-send "Transcribing"`;
          
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
            logger.debug(`transcription: ${transcription}`);
          });

          whisperProcess.stderr.on("data", (data) => {
            errorOutput += data.toString();
          });

          whisperProcess.on("close", async (whisperExitCode) => {
            isTranscribing = false;
            if (whisperExitCode !== 0) {
              logger.error("Transcription failed", { code: whisperExitCode, error: errorOutput });
              $`notify-send "Transcription failed"`;
            } else {
              logger.debug("Transcription completed");
              // $`notify-send "Transcription completed"`;
              
              const transcriptionFile = path.join("/tmp", `voice-recording-${timestamp}.txt`);
              try { 
                await fs.copyFile(transcriptionFile, filepath);
                await fs.unlink(transcriptionFile);
                logger.debug("Transcription file moved", { from: transcriptionFile, to: filepath });

                const transcriptionContent = await fs.readFile(filepath, 'utf-8');
                if (transcriptionContent.trim()) {
                  $`notify-send ${transcriptionContent.trim()}`;
                }

                // Check if daemon is ready before opening file
                try {
                  await $`emacsclient -s transcriptions --eval "(message \\"daemon ready\\")"`;
                  // Open the file in Emacs
                  const child = spawn(
                    "/usr/bin/emacsclient",
                    ["-c", "-s", "transcriptions", filepath],
                    { detached: true, stdio: "ignore" }
                  );
                  child.unref();
                } catch (daemonError) {
                  logger.error("Emacs daemon not ready", { error: daemonError });
                  $`notify-send "Emacs daemon not ready - transcription saved to ${filepath}"`;
                }

              } catch (fileError) {
                logger.error("Failed to read or move transcription file", { error: fileError, file: transcriptionFile });
              }
            }
          });

          resolve();
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

export const transcribeWhisperAction: Action = {
  id: "transcribeWhisper",
  name: "Transcribe with Whisper",
  type: ActionType.BASE,
  handler: recordOrTranscribe,
};

registerAction(transcribeWhisperAction);
