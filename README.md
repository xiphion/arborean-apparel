[![Discord](https://discordapp.com/api/guilds/385946679733518338/widget.png)](https://discord.gg/dzB7xZK)

# Arborean Apparel


![<sub>update when?</sub>](https://i.imgur.com/YNBcrI5.pngg)


- [Arborean Apparel](#arborean-apparel)
    - [How to:](#how-to)
    - [Usage:](#usage)
      - [Updating:](#updating)
      - [Online:](#online)
  - [FAQ/Errors:](#faqerrors)
  - [Todo:](#todo)
  - [Update log (Last few, 26th March) -](#update-log-last-few-26th-march-)




***
<removed dingus donation link>
***
### How to:

- Download and install [Caali's Proxy](https://tinyurl.com/caalitera)
- Download the prepackaged script from the [releases tab](https://github.com/iribae/arborean-apparel/releases)
- Extract/paste contents of the .zip into your `tera-proxy` directory, overwriting when asked.
- Start Tera-Proxy with the included ElectronStart.bat

I also recommend checking the options in `config.json`.

If this doesn't work or isn't clear, hit me up @@@@ Pentagon#0099 on discord.

### Usage:
To open the UI type `aa open` into /proxy or `!aa open` into a normal chat. There are other commands but everything is controlled through the UI and I'm probably going to delete them because I hate ease of use.
A brief overview of how to use the module can be found [here](https://www.youtube.com/watch?v=i-y2D_2DUZ8.com) (the UI has changed a little but it's the same stuff).

#### Updating:
This mod support auto-updating via [Caali's Proxy](https://tinyurl.com/caalitera). 

I also updating electron frequently to ensure the best comparability, which can be done by downloading the latest release from [this page](https://github.com/electron/electron/releases), and extracting it to `/Tera-Proxy/electron/dist`

#### Online:
By default Apparel will share your costume selections with other people using the module around you by connecting to an external server. If this doesn't sound like your cup of tea, simply edit config.json and change `online: true` to `false`.

The server is run by *a specific party* for free, if you want your own special server for your guild or something, hit me up (this is also free). Server software is also on this github if you don't trust me at all and wish to run one your self. This only affects the costume sharing aspect.
****
## FAQ/Errors: 

`Crypto error, falling back to slower JS version` Update electron, either through downloading the prebuild version in releases, downloading it from [here](https://github.com/electron/electron/releases), or npm installing it (if you know how).

`The UI is invisible!!!` Try turning `transparent` to false. Some users with older operating systems may experience this bug.

`Your version of Node.JS is too old to run tera-proxy. Version 9.0.0 or newer is required.` Please read the readme and download the proxy linked above.

`TypeError: electron.BrowserWindow is not a constructor or cannot find module 'Electron'`: Proxy isn't running as electron, please make sure you have downloaded and overwritten (or made copies of) the files in the [full release](https://github.com/iribae/arborean-apparel/releases), and are running it with the supplied .bat file.

`The system cannot find the path specified.`: You don't have electron installed in tera-proxy/node_modules, refer to the above.

`Script no work` Please make sure you're using an updated version before messaging me, and have read the readme (and I mean actually have read the readme).

`Electron.exe is not compatible with this version of windows` Please download the electron prebuilt for your OS [here](https://github.com/electron/electron/releases) and extract it into `tera-proxy/node_modules/dist` over the top of the existing one.

`y dis mod so big`  - It's 46MB smaller now!! I could reduce this further by hosting the images on the server, however that would devour too much bandwidth for the both of us.
***
## Todo:
- Do hat stuff
- Remove or fix emotes
- Add effect/slider saving
- Add more effects
- Make code less bad
- Add race/appearance changing
- Tidy up UI
- Add more features 
- other stuff
 ***
 
## Update log (Jun 18)
- Images now loaded from server provided by [SaltyMonkey](https://github.com/SaltyMonkey/), you can delete img.asar from the /www folder now.
- Fixed several minor issues in regards to the UI.
- Added `skyEveryMap`to the config, allowing the selected sky preset to be applied every time a new map is loaded.
