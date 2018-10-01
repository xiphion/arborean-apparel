const Server = require('./networking')

const port = process.env.PORT || 3458
const secure = false
const users = {}
const EMOTES = {
	bow: 43,
	kitchen: 44,
	dance: 44,
	settle: 51,
	peace: 52
}

const server = new Server({}, (client) => {
	let curId = false

	function check(cb) {
		return (...args) => (curId !== false) && cb(...args)
	}

	function logout() {
		if (curId !== false) {
			client.broadcast('remove', curId)
			delete users[curId]
			curId = false
		}
	}

	client.send('users', users)

	client.on('login', (id) => {
		if (curId !== false && curId !== id) delete users[curId]
		curId = id
		users[id] = { override: {}, options: {} }
		client.broadcast('add', id)
	})
	client.on('outfit', check((override) => {
		users[curId].override = override;
		client.broadcast('outfit', curId, override)
	}))
	client.on('mount', check((mount) => {
		users[curId].mount = mount;
		client.broadcast('mount', curId, mount)
	}))
	client.on('text', check((costume, costumeText) => {
		Object.assign(users[curId], { costume, costumeText })
		client.broadcast('text', curId, costume, costumeText)
	}))

	client.on('option', check((key, val) => {
		users[curId].options[key] = val
		client.broadcast('option', curId, key, val)
	}))

	client.on('emote', check((name) => {
		const emote = EMOTES[name]
		if (emote) client.broadcast('emote', curId, emote)
	}))

	client.on('cb', check((cb) => {
		client.broadcast('cb', curId, cb)
	}))

	client.on('changer', check((field, value) => {
		client.broadcast('changer', curId, field, value)
	}))
        //
	client.on('abnBegin', check((abnormal) => {
		client.broadcast('abnBegin', curId, abnormal );
	}));
        
        client.on('abnEnd', check((abnormal) => {
		client.broadcast('abnEnd', curId, abnormal);
	}));
        //
	client.on('logout', logout)
	client.on('close', logout)
})

server.listen(port, () => {
	console.log(`listening on ${port} (${secure ? 'secure' : 'insecure'})`)
})
