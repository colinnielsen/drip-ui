import { PrivyDID } from './PrivyType';

export const isPrivyDID = (id: string): id is PrivyDID => {
  return id.startsWith('did:privy:');
};
