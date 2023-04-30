import { execSync } from 'child_process';
import { existsSync, readdirSync, statSync } from 'fs';
import * as path from 'path';
import { Command } from 'commander';

const subdirs = (dir: string, excludedDirs: string[]) => {
  return readdirSync(dir)
    .filter((subdir) => statSync(path.join(dir, subdir)).isDirectory())
    .filter((subdir) => !excludedDirs.includes(subdir) && subdir[0] !== '.')
    .map((subdir) => path.join(dir, subdir));
};

const execCmd = (cmd: string, dir: any, excludedDirs: string[]) => {
  const root = path.resolve(process.cwd() + '/..');
  const installable = existsSync(path.join(dir, 'package.json'));

  if (installable && dir !== root) {
    console.log(`\n🚧🚧🚧 ${cmd} ${dir}`);

    execSync(cmd, { cwd: dir, env: process.env, stdio: 'inherit' });
  }

  for (let subdir of subdirs(dir, excludedDirs)) {
    execCmd(cmd, subdir, excludedDirs);
  }
};

const runCmd = () => {
  try {
    const program = new Command();
    program.arguments('<cmd> [excludedDirs]');
    program.parse();

    const cmd = program.args[0] ?? '';
    const root = path.resolve(process.cwd() + '/..');
    const excludedDirs = program.args.length > 1 ? program.args[1].split(',') ?? [] : [];

    execCmd(cmd, root, excludedDirs);
  } catch (error) {
    console.error('🛑 Error deploying CDK app\n', error);
    process.exit(-1);
  }
};

runCmd();
