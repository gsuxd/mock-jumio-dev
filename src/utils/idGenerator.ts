import crypto from 'crypto';

export const generateId = (prefix: string = ''): string => {
  const randomBytes = crypto.randomBytes(16).toString('hex');
  return prefix ? `${prefix}_${randomBytes}` : randomBytes;
};

export const generateAccountId = (): string => {
  return generateId('acc');
};

export const generateWorkflowExecutionId = (): string => {
  return generateId('wfe');
};

export const generateCredentialId = (): string => {
  return generateId('crd');
};
