import fs from 'fs';
export function readHosts() {
  return fs.readFileSync('/etc/hosts', 'utf8');
}