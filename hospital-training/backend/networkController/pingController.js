const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

const IP_REGEX = /^\d{1,3}(\.\d{1,3}){3}$/;
function isValidIP(ip) {
  if (!IP_REGEX.test(ip)) return false;
  return ip.split('.').every(num => parseInt(num) <= 255);
}

const pingController = async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip || !isValidIP(ip)) {
      return res.status(400).json({ error: 'Invalid IP address' });
    }

    const isMac = process.platform === 'darwin';
    const command = isMac ? `ping -c 4 ${ip}` : `ping -n 4 ${ip}`;
    const { stdout, stderr } = await execAsync(command);

    res.json({ output: stdout || stderr || 'No response from ping', status: 'success' });
  } catch (error) {
    res.json({
      output: error.stdout || error.stderr || error.message,
      error: 'Ping failed',
      status: 'error'
    });
  }
};

module.exports = pingController; 