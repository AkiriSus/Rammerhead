import createRammerhead from "rammerhead/src/server.js";

import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { hostname } from "node:os";
import { Command } from "commander";
import serveStatic from "serve-static";
import connect from "connect";
import isPortFree from "is-port-free";

// The following message MAY NOT be removed
console.log("Rammerhead easy deployment version\nThis program comes with ABSOLUTELY NO WARRANTY.\nThis is free software, and you are welcome to redistribute it\nunder the terms of the GNU General Public License as published by\nthe Free Software Foundation, either version 3 of the License, or\n(at your option) any later version.\n\nYou should have received a copy of the GNU General Public License\nalong with this program. If not, see <https://www.gnu.org/licenses/>.\n");

const app = connect();

const program = new Command();

program.name("rammerhead");
program.description("Improved rammerhead easy deployment version");
program.option(
	"-rp --reverse-proxy",
	"Controls rammerhead's IP configuration",
	false,
);
program.parse(process.argv);

let rh;

const options = program.opts();

if (options.reverseProxy) {
	rh = createRammerhead({ reverseProxy: true });
} else {
	rh = createRammerhead({ reverseProxy: false });
}

const server = createServer();

// used when forwarding the script
const rammerheadScopes = [
	"/rammerhead.js",
	"/hammerhead.js",
	"/transport-worker.js",
	"/task.js",
	"/iframe-task.js",
	"/worker-hammerhead.js",
	"/messaging",
	"/sessionexists",
	"/deletesession",
	"/newsession",
	"/editsession",
	"/needpassword",
	"/syncLocalStorage",
	"/api/shuffleDict",
	"/mainport",
];
const rammerheadSession = /^\/[a-z0-9]{32}/;

function shouldRouteRh(req) {
	const url = new URL(req.url, "http://0.0.0.0");
	return (rammerheadScopes.includes(url.pathname) || rammerheadSession.test(url.pathname));
}

app.use((req, res, next) => {
    if(shouldRouteRh(req)) rh.emit("request", req, res); else next();
});

app.use(serveStatic(fileURLToPath(new URL("../static/", import.meta.url))));

server.on("request", app);
server.on("upgrade", (req, socket, head) => {
    if(shouldRouteRh(req)) rh.emit("upgrade", req, socket, head); else socket.end();
});

server.on("listening", () => {
  const addr = server.address();

  console.log(
	"\n",
	options.reverseProxy
		? "Running rammerhead with a reverse proxy configuration setup"
		: "Running rammerhead without a reverse proxy configuration setup"
  );

  console.log(`Server running on port ${addr.port}`)
  console.log("");
  console.log("You can now view it in your browser.")
  /* Code for listing IPS from website-aio */
  console.log(`Local: http://${addr.family === "IPv6" ? `[${addr.address}]` : addr.address}${addr.port === 80? "" : ":" + addr.port}`);
  console.log(`Local: http://localhost${addr.port === 80? "" : ":" + addr.port}`);
  try { console.log(`On Your Network: http://${hostname()}${addr.port === 80? "" : ":" + addr.port}`); } catch (err) {/* Can't find LAN interface */};
});

isPortFree(8080).then(()=>{
	server.listen({ port: 8080 });
}).catch(()=>{
	/*Listen on an obscurely-listened port if 8080 isn't free*/
	server.listen({ port: 1234 });
});