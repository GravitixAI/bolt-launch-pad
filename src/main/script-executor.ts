import { spawn, SpawnOptions } from 'child_process';

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
  return executeScript('powershell', [
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-Command', scriptContent
  ], timeout);
}

/**
 * Execute CMD script
 */
export async function executeCmdScript(
  scriptContent: string,
  timeout: number = EXECUTION_TIMEOUT
): Promise<ScriptExecutionResult> {
  return executeScript('cmd', ['/c', scriptContent], timeout);
}

/**
 * Generic script execution
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
    // Quote the executable path if it contains spaces and isn't already quoted
    let quotedPath = executablePath.trim();
    if (quotedPath.includes(' ') && !quotedPath.startsWith('"')) {
      quotedPath = `"${quotedPath}"`;
    }
    
    // Parse parameters - be smart about quotes in parameters
    const args = parameters ? parameters.split(' ').filter(arg => arg.trim()) : [];
    
    const options: SpawnOptions = {
      shell: true,
      windowsHide: false,
    };

    console.log(`🚀 Launching: ${quotedPath} ${args.join(' ')}`);
    const process = spawn(quotedPath, args, options);
    
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

