//=============================================================================
// EnemyBook_Ext.js
//=============================================================================

/*
 * @plugindesc Adds improved functionality to EnemyBook.
 * @author David Schwerstein
 *
 * @param Menu Item
 * @desc Adds a menu item for the enemy book. (true/false)
 * @default true
 *
 * @param Font Size
 * @desc Changes the font size of the text in the bestiary.
 * @default 20
 *
 * @param Font Outline Width
 * @desc This is the default font outline width for all text.
 * Default: 0
 * @default 0
 *
 * @param Debug Mode
 * @desc Sets whether or not console messages are output. (true/false)
 * Default: false
 * @default false
 *
 * Enemy Note:
 *   <desc:foobar>          # Description text in the enemy book
 *   <type:animal>          # Enemy type
 */

(function() {
  var parameters = PluginManager.parameters('EnemyBook');
  var unknownData = String(parameters['Unknown Data'] || '??????');
  var menuItem = String(parameters['Menu Item'] || 'true').toLowerCase();
  var $fontSize = Number(parameters['Font Size'] || 20);
  var paragraph_line;
  var textOutline = Number(parameters['Font Outline']) || 0;
  var debugMode = String(parameters['Debug Mode'] || 'false').toLowerCase();

  Scene_EnemyBook.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this._indexWindow = new Window_EnemyBookIndex(0, 0);
    this._indexWindow.setHandler('cancel', this.popScene.bind(this));
    var wy = this._indexWindow.height;
    var ww = Graphics.boxWidth;
    var wh = Graphics.boxHeight - wy;
    var dy = this._indexWindow.height;
    var dw = 480;
    var dh = Graphics.boxHeight - dy;
    var dx = Graphics.boxWidth - dw;
    this._statusWindow = new Window_EnemyBookStatus(0, wy, ww, wh);
    this.addWindow(this._indexWindow);
    this.addWindow(this._statusWindow);
    this._indexWindow.setStatusWindow(this._statusWindow);
  };

  function compare(a, b) {
    if (a.name < b.name)
      return -1;
    if (a.name > b.name)
      return 1;
    return 0;
  }


  Window_EnemyBookIndex.prototype.refresh = function() {
    this._list = [];
    for (var i = 1; i < $dataEnemies.length; i++) {
      var enemy = $dataEnemies[i];
      if (enemy.name && enemy.meta.book !== 'no') {
        this._list.push(enemy);
      }
    }

    this._list.sort(compare);
    this.createContents();
    this.drawAllItems();
  };

  Window_EnemyBookIndex.prototype.drawItem = function(index) {
    var enemy = this._list[index];
    var rect = this.itemRectForText(index);
    var name;
    if ($gameSystem.isInEnemyBook(enemy)) {
      name = enemy.name;
    } else {
      name = unknownData;
    }
    this.contents.fontSize = $fontSize;
    if ( typeof rect !== undefined) {
      this.drawText(index + 1 + ' - ' + name, rect.x, rect.y, rect.width);
    }
  };

  var descWidth = 750;

  Window_EnemyBookStatus.prototype.initialize = function(x, y, width, height) {
    Window_Base.prototype.initialize.call(this, x, y, width, height);

    var bestiary_bar = new Sprite_Base();
    bestiary_bar.bitmap = ImageManager.loadBitmap('img/ui/', 'bestiary_bar', '', true);
    bestiary_bar.x = 0;
    bestiary_bar.y = 5;
    this.addChildAt(bestiary_bar, 1);

    this._enemy = null;
    this._enemySprite = new Sprite();
    this._enemySprite.anchor.x = 0.5;
    this._enemySprite.anchor.y = 0.5;
    this._enemySprite.x = 200;
    this._enemySprite.y = height / 2;
    this.addChildToBack(this._enemySprite);
    this.refresh();
  };

  Array.prototype.clean = function(deleteValue) {
    for (var i = 0; i < this.length; i++) {
      if (this[i] == deleteValue) {
        this.splice(i, 1);
        i--;
      }
    }
    return this;
  };

  Window_EnemyBookStatus.prototype.getDescription = function(enemy) {
    var note = enemy.note, keyword_start = "<paragraphs>", keyword_end = "</paragraphs>", start = note.indexOf(keyword_start) + keyword_start.length, end = note.indexOf(keyword_end), string_list = note.substr(start, end);
    this._enemyDescription = string_list.split(/\n/);

    this._enemyDescription.clean(keyword_end);
    this._enemyDescription.clean("");
  };

  Window_EnemyBookStatus.prototype.refresh = function() {
    var enemy = this._enemy;
    var x = 0;
    var y = 0;
    var lineHeight = this.lineHeight();

    this.contents.clear();

    if (!enemy || !$gameSystem.isInEnemyBook(enemy)) {
      this._enemySprite.bitmap = null;
      return;
    }

    var name = enemy.battlerName;
    var hue = enemy.battlerHue;

    if (debugMode === 'true') {
      console.dir(this._enemySprite);
    }

    if (enemy.meta.enemyx != undefined) {
      this._enemySprite.x = 200 + parseInt(enemy.meta.enemyx);
    }

    var bitmap;

    if ($gameSystem.isSideView()) {
      bitmap = ImageManager.loadSvEnemy(name, hue);
    } else {
      bitmap = ImageManager.loadEnemy(name, hue);
    }

    this._enemySprite.bitmap = bitmap;

    this.contents.fontSize = $fontSize;

    this.resetTextColor();
    this.drawText(enemy.name, x, y);
    y += lineHeight * 1 - 10;
    this.changeTextColor(this.textColor(3));
    this.drawText(enemy.meta.type, x, y);

    this.getDescription(enemy);

    if ( typeof this.contents !== undefined) {
      x = this.contents.width - descWidth;
    } else {
      x = 0;
    }

    y = 0;

    for (var i = 0; i < this._enemyDescription.length; i++) {
      this.textState = {};
      this.textState.index = 0;
      this.textState.line = 1;
      this.textState.text = this.convertEscapeCharacters(this._enemyDescription[i]);
      this.processNormalCharacter(this.textState);

      this.drawTextEx(this.textState.text, x, y, descWidth);
      y += (this.contents.fontSize * this.textState.line) + (this.textPadding() * this.textState.line) + lineHeight - 10;
    }

    this.resetFontSettings();
  };

  // Word Wrapping
  var _Window_Base_processNormalCharacter = Window_Base.prototype.processNormalCharacter;
  var _Window_Base_convertEscapeCharacters = Window_Base.prototype.convertEscapeCharacters;

  Window_EnemyBookStatus.prototype.textAreaWidth = function() {
    return this.contentsWidth();
  };

  Window_EnemyBookStatus.prototype.needWrap = function(textState) {
    var c = textState.text[textState.index], w = this.textWidth(c), nextSpaceIndex = 0, nextWord = "", nextWidth = 0, text = textState.text;

    if (c === " ") {
      nextSpaceIndex = text.indexOf(" ", textState.index + 1);

      if (nextSpaceIndex < 0) {
        nextSpaceIndex = text.length + 1;
      }

      nextWord = text.substring(textState.index, nextSpaceIndex);
      nextWidth = this.textWidth(nextWord);

      if (textState.x + nextWidth >= this.textAreaWidth()) {
        return true;
      }
    }

    return false;
  };

  Window_EnemyBookStatus.prototype.convertEscapeCharacters = function(text) {
    text = _Window_Base_convertEscapeCharacters.call(this, text);
    text = this.convertWordWrapEscapeCharacters(text);

    return text;
  };

  Window_EnemyBookStatus.prototype.convertWordWrapEscapeCharacters = function(text) {
    text = text.replace(/[\n\r]+/g, '');
    text = text.replace(/\[br\]/gi, '\n');

    return text;
  };

  var _Window_Base_processEscapeCharacter = Window_Base.prototype.processEscapeCharacter;
  Window_Base.prototype.processEscapeCharacter = function(code, textState) {
    switch (code) {
    case 'MSGCORE':
      var id = this.obtainEscapeParam(textState);
      if (id === 0) {
        $gameSystem.initMessageFontSettings();
        this.resetFontSettings();
      }
      if (id === 1)
        this.contents.fontBold = !this.contents.fontBold;
      if (id === 2)
        this.contents.fontItalic = !this.contents.fontItalic;
      break;
    case 'OC':
      var id = this.obtainEscapeParam(textState);
      this.contents.outlineColor = this.textColor(id);
      break;
    case 'PX':
      textState.x = this.obtainEscapeParam(textState);
      break;
    case 'PY':
      textState.y = this.obtainEscapeParam(textState);
      break;
    default:
      _Window_Base_processEscapeCharacter.call(this, code, textState);
      break;
    }
  };

  Window_EnemyBookStatus.prototype.processNormalCharacter = function(textState) {
    this.contents.fontSize = $fontSize;
    textState.height = 28;

    if (this.needWrap(textState)) {
      this.textState.line += 1;
      return this.processNewLine(textState);
    }

    _Window_Base_processNormalCharacter.call(this, textState);
  };

  // Adding EnemyBook to Menu
  if (menuItem === "true") {
    var _SceneMenu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
    Scene_Menu.prototype.createCommandWindow = function() {
      _SceneMenu_createCommandWindow.call(this);
      this._commandWindow.setHandler('enemyBook', this.commandEnemyBook.bind(this));
    };

    Scene_Menu.prototype.commandEnemyBook = function() {
      SceneManager.push(Scene_EnemyBook);
    };

    var _WindowMenuCommand_addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
    Window_MenuCommand.prototype.addOriginalCommands = function() {
      _WindowMenuCommand_addOriginalCommands.call(this);
      this.addCommand("Enemy Book", 'enemyBook', 1);
    };
  }
})();
