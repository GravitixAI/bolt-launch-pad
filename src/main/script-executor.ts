import { spawn, SpawnOptions } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface ScriptExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: string;
}

const EXECUTION_TIMEOUT = 300000; // 5 minutes

/**
 * Execute PowerShell script
 */
export async function executePowerShellScript(
  scriptContent: string,
  timeout: number = EXECUTION_TIMEOUT
): Promise<ScriptExecutionResult> {
  // Wrap script to capture ALL output streams (including Write-Host, formatted output, etc.)
  // Use Out-String to convert all pipeline output to strings
  const wrappedScript = `$ErrorActionPreference = 'Continue'; ${scriptContent} *>&1 | Out-String -Width 1000`;
  
  return executeScriptDirect('powershell', [
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-Command', wrappedScript
  ], timeout);
}

/**
 * Execute CMD script
 */
export async function executeCmdScript(
  scriptContent: string,
  timeout: number = EXECUTION_TIMEOUT
): Promise<ScriptExecutionResult> {
  // Write script to a temporary .bat file to properly handle multi-line scripts
  // and ensure all output (including from wmic, etc.) is captured
  const tempDir = os.tmpdir();
  const tempScriptPath = path.join(tempDir, `script_${Date.now()}.bat`);
  
  try {
    // Add @echo off at the beginning if not already present for cleaner output
    let finalScript = scriptContent.trim();
    if (!finalScript.toLowerCase().startsWith('@echo off')) {
      finalScript = '@echo off\n' + finalScript;
    }
    
    // Write the script content to the temp file
    fs.writeFileSync(tempScriptPath, finalScript, { encoding: 'utf8' });
    
    // Execute the batch file directly
    const result = await executeScriptDirect('cmd', ['/c', tempScriptPath], timeout);
    
    // Clean up the temp file
    try {
      fs.unlinkSync(tempScriptPath);
    } catch (cleanupError) {
      console.warn('Failed to delete temp script file:', cleanupError);
    }
    
    return result;
  } catch (error) {
    // Clean up on error
    try {
      if (fs.existsSync(tempScriptPath)) {
        fs.unlinkSync(tempScriptPath);
      }
    } catch (cleanupError) {
      console.warn('Failed to delete temp script file:', cleanupError);
    }
    
    return {
      success: false,
      stdout: '',
      stderr: '',
      exitCode: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Generic script execution (direct, no shell)
 */
function executeScriptDirect(
  command: string,
  args: string[],
  timeout: number
): Promise<ScriptExecutionResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let killed = false;

    const options: SpawnOptions = {
      shell: false, // Direct execution, don't use cmd.exe as intermediary
      windowsHide: false, // Show console window for visibility
    };

    const process = spawn(command, args, options);

    // Set timeout
    const timeoutId = setTimeout(() => {
      if (!killed) {
        killed = true;
        process.kill();
        stderr += '\n[Script execution timed out]';
      }
    }, timeout);

    // Capture stdout
    process.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    // Capture stderr
    process.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    // Handle process completion
    process.on('close', (code) => {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      console.log(`Script execution completed in ${duration}ms with exit code ${code}`);

      resolve({
        success: code === 0 && !killed,
        stdout,
        stderr,
        exitCode: code,
      });
    });

    // Handle errors
    process.on('error', (error) => {
      clearTimeout(timeoutId);
      
      resolve({
        success: false,
        stdout,
        stderr,
        exitCode: null,
        error: error.message,
      });
    });
  });
}

/**
 * Generic script execution (with shell)
 */
function executeScript(
  command: string,
  args: string[],
  timeout: number
): Promise<ScriptExecutionResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let killed = false;

    const options: SpawnOptions = {
      shell: true,
      windowsHide: false, // Show console window for visibility
    };

    const process = spawn(command, args, options);

    // Set timeout
    const timeoutId = setTimeout(() => {
      if (!killed) {
        killed = true;
        process.kill();
        stderr += '\n[Script execution timed out]';
      }
    }, timeout);

    // Capture stdout
    process.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    // Capture stderr
    process.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    // Handle process completion
    process.on('close', (code) => {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      console.log(`Script execution completed in ${duration}ms with exit code ${code}`);

      resolve({
        success: code === 0 && !killed,
        stdout,
        stderr,
        exitCode: code,
      });
    });

    // Handle errors
    process.on('error', (error) => {
      clearTimeout(timeoutId);
      
      resolve({
        success: false,
        stdout,
        stderr,
        exitCode: null,
        error: error.message,
      });
    });
  });
}

/**
 * Execute executable with parameters
 */
export async function executeExecutable(
  executablePath: string,
  parameters?: string,
  timeout: number = EXECUTION_TIMEOUT
): Promise<ScriptExecutionResult> {
  return new Promise((resolve) => {
    const args = parameters ? parameters.split(' ').filter(arg => arg.trim()) : [];
    
    const options: SpawnOptions = {
      shell: true,
      windowsHide: false,
    };

    const process = spawn(executablePath, args, options);
    
    let stdout = '';
    let stderr = '';
    let killed = false;

    const timeoutId = setTimeout(() => {
      if (!killed) {
        killed = true;
        process.kill();
        stderr += '\n[Execution timed out]';
      }
    }, timeout);

    process.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      clearTimeout(timeoutId);

      resolve({
        success: code === 0 && !killed,
        stdout,
        stderr,
        exitCode: code,
      });
    });

    process.on('error', (error) => {
      clearTimeout(timeoutId);
      
      resolve({
        success: false,
        stdout,
        stderr,
        exitCode: null,
        error: error.message,
      });
    });
  });
}

/**
 * Validate script content for basic safety
 * Note: This is not comprehensive security - users should be trusted
 */
export function validateScriptSafety(scriptContent: string): { safe: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const dangerousPatterns = [
    /format\s+[a-z]:/i, // Format drive
    /del\s+\/[sq]/i, // Delete with force/quiet
    /rd\s+\/[sq]/i, // Remove directory with force
    /Remove-Item.*-Recurse.*-Force/i, // PowerShell recursive delete
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(scriptContent)) {
      warnings.push(`Potentially dangerous operation detected: ${pattern.toString()}`);
    }
  }

  return {
    safe: warnings.length === 0,
    warnings,
  };
}
