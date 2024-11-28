import ngrok from 'ngrok';
import config from '../config';

export async function setupTunneling(freePort) {
  console.log(`Server running on http://localhost:${freePort}`);
  console.log(`Now setup tunneling...`);
  // Start ngrok to expose the server
  try {
    await ngrok.disconnect();
    await ngrok.kill();
    const url = await ngrok.connect({
      port: freePort,
      authtoken: config.NGROK_AUTH_TOKEN,
    });
    console.log(`Ngrok tunnel is live at ${url}`);
    return url;
  } catch (error) {
    console.error('Error starting ngrok:', error);
    throw error;
  }
}
