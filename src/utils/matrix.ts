
import * as github from '@actions/github';

export function getMatrixKey(): string | undefined {
  // Capture matrix context from GitHub Actions environment
  // Matrix keys are available as environment variables like:
  // MATRIX_NODE_VERSION, MATRIX_OS, etc.
  const matrixValues: string[] = [];
  
  // Common matrix variable names
  const matrixVars = [
    'MATRIX_NODE_VERSION',
    'MATRIX_OS',
    'MATRIX_PYTHON_VERSION',
    'MATRIX_JAVA_VERSION',
    'MATRIX_RUBY_VERSION'
  ];
  
  for (const varName of matrixVars) {
    const value = process.env[varName];
    if (value) {
      matrixValues.push(`${varName.replace('MATRIX_', '').toLowerCase()}:${value}`);
    }
  }
  
  // Also check for generic matrix context via GitHub context
  // In matrix builds, github.context.job includes matrix info
  if (github.context.job && github.context.job.includes('matrix')) {
    matrixValues.push(github.context.job);
  }
  
  return matrixValues.length > 0 ? matrixValues.join(',') : undefined;
}
