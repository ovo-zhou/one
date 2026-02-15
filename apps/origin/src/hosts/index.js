import fs from 'node:fs/promises';
import os from 'os';
import path from 'path';
import { exec } from 'child_process';
import sudo from 'sudo-prompt';
export default class Hosts {
  // 获取 hosts 文件路径
  getHostsPath() {
    const platform = os.platform();
    switch (platform) {
      case 'win32':
        return 'C:\\Windows\\System32\\drivers\\etc\\hosts';
      case 'darwin':
      case 'linux':
        return '/etc/hosts';
      default:
        return '/etc/hosts';
    }
  }
  readHostsFile = async () => {
    return await fs.readFile(this.getHostsPath(), { encoding: 'utf8' });
  }
  writeHostsFile = async (content) => {
    try {
      if (process.platform === 'win32') {
        // Windows 需要管理员权限
        await this.writeWithAdminWin(content);
      } else {
        // macOS/Linux 使用 sudo
        await this.writeWithSudo(content);
      }
      return true;
    } catch (error) {
      console.error('写入 hosts 文件失败:', error);
      throw error;
    }
  }
  async writeWithAdminWin(content) {
    return new Promise((resolve, reject) => {
      const tempPath = path.join(os.tmpdir(), 'hosts_temp');

      // 先写入临时文件
      fs.writeFile(tempPath, content)
        .then(() => {
          const command = `copy "${tempPath}" "${this.hostsPath}"`;

          exec(command, { shell: 'cmd.exe' }, (error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        })
        .catch(reject);
    });
  }
  writeWithSudo = async (content) => {
    return new Promise((resolve, reject) => {
      const command = `echo '${content.replace(/'/g, "'\"'\"'")}' > ${this.getHostsPath()}`;
      sudo.exec(command, { name: 'origin' }, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}