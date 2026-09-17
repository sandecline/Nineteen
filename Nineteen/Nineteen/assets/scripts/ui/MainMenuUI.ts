import { _decorator, Component, director } from 'cc';
const { ccclass } = _decorator;

@ccclass('MainMenuUI')
export class MainMenuUI extends Component {
  public onClickStart() {
    director.loadScene('Game');
  }
}