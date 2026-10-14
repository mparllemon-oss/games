import {Game} from './game.js';
import {UI} from './ui.js';
import {loadProfile,saveProfile} from './save.js';
const profile=loadProfile();const ui=new UI(profile);const game=new Game(document.querySelector('#game'),ui,profile);ui.attach(game);
