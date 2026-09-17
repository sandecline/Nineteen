// RadioPuzzleButtonSetup.js
// 在 Cocos Creator 编辑器中：菜单 -> 开发者 -> 运行脚本
// 此脚本将自动为所有收音机按钮配置点击事件

const BUTTON_CONFIG = [
  { name: 'Btn_0', handler: 'onClickDigit', customEventData: '0' },
  { name: 'Btn_1', handler: 'onClickDigit', customEventData: '1' },
  { name: 'Btn_2', handler: 'onClickDigit', customEventData: '2' },
  { name: 'Btn_3', handler: 'onClickDigit', customEventData: '3' },
  { name: 'Btn_4', handler: 'onClickDigit', customEventData: '4' },
  { name: 'Btn_5', handler: 'onClickDigit', customEventData: '5' },
  { name: 'Btn_6', handler: 'onClickDigit', customEventData: '6' },
  { name: 'Btn_7', handler: 'onClickDigit', customEventData: '7' },
  { name: 'Btn_8', handler: 'onClickDigit', customEventData: '8' },
  { name: 'Btn_9', handler: 'onClickDigit', customEventData: '9' },
  { name: 'Btn_Star', handler: 'onClickStar', customEventData: '*' },
  { name: 'Btn_Hash', handler: 'onClickHash', customEventData: '#' },
  { name: 'Btn_TuneUp', handler: 'onClickTuneUp', customEventData: '' },
  { name: 'Btn_TuneDown', handler: 'onClickTuneDown', customEventData: '' },
];

async function setupRadioButtons() {
  const scene = Editor.Scene.scene;
  if (!scene) {
    console.error('No scene found!');
    return;
  }

  // 查找 RadioPuzzleCtrl 节点
  const radioCtrlNode = scene.getChildByName('RadioPuzzleCtrl');
  if (!radioCtrlNode) {
    console.error('RadioPuzzleCtrl node not found!');
    return;
  }

  const radioCtrlUuid = radioCtrlNode.uuid;

  for (const config of BUTTON_CONFIG) {
    const btnNode = scene.getChildByName(config.name);
    if (!btnNode) {
      console.warn(`Button node ${config.name} not found, skipping...`);
      continue;
    }

    const buttonComp = btnNode.getComponent('cc.Button');
    if (!buttonComp) {
      console.warn(`Button component not found on ${config.name}, skipping...`);
      continue;
    }

    // 创建 ClickEvent
    const clickEvent = new cc.ClickEvent();
    clickEvent.target = radioCtrlNode;
    clickEvent.handler = config.handler;
    clickEvent.customEventData = config.customEventData;

    // 添加到按钮的点击事件数组
    buttonComp.clickEvents.push(clickEvent);

    console.log(`Configured ${config.name} -> ${config.handler}(${config.customEventData})`);
  }

  console.log('Radio button setup completed!');
  Editor.success('All radio buttons configured successfully!');
}

setupRadioButtons();
