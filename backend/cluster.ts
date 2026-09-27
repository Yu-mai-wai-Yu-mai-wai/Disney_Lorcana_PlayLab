// Production entry: one worker per vCPU. A single Node process tops out at 50% on a 2-vCPU t3.micro,
// so the ASG's 60% CPU target could never be reached (measured 2026-09-27).
import cluster from 'cluster';
import os from 'os';

if (cluster.isPrimary) {
  for (let i = 0; i < os.availableParallelism(); i++) cluster.fork();
  // ponytail: any worker exit restarts the whole service via systemd (Restart=always); re-fork per worker if blips matter
  cluster.on('exit', (worker, code) => {
    console.error(`[cluster] worker ${worker.process.pid} exited (${code}); exiting for systemd restart`);
    process.exit(1);
  });
} else {
  require('./server');
}
