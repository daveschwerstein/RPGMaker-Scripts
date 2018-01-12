/*:
 * @title GameusQuestSystem Extension
 * @author David Schwerstein
 * @date Jan 25, 2017
 *
 * @plugindesc Contains all of the customizations for GameusQuestSystem.
 */

(function() {

  var $fontSize = 20;

  //---------------------------------------------------------------------------------------------
  // Window_Base
  //---------------------------------------------------------------------------------------------
  Window_Base.prototype.sliceText = function(text, width) {
    text = text.replace(/\<br\>/gi, ' <br> ');
    var words = text.split(" ");
    if (words.length === 1)
      return words;
    var result = [];
    var current_text = words.shift();
    for (var i = 0; i < words.length; i += 1) {
      var word = words[i];
      var textW = this.contents.measureTextWidth(current_text + " " + word);
      if (word == '<br>') {
        result.push(current_text);
        current_text = "";
      } else if (textW > width) {
        result.push(current_text);
        current_text = word;
      } else {
        current_text += " " + word;
      }
      current_text = current_text.trim();
      if (i >= words.length - 1)
        result.push(current_text);
    }
    return result;
  };

  Window_QuestInfo.prototype.createQuestBitmap = function() {
    this.questBitmap.clear();
    if (this.quest > 0) {
      this.questBitmap.paintOpacity = 255;
      var q = $gameQuests.get(this.quest);
      this.drawQuestInfo(q);

      // Check for resize, then redraw
      if (this.resizeFlag) {
        this.resizeFlag = false;
        this.createQuestBitmap();
      }
      if (this.failedImg !== '' && q.status === "failed") {
        this.questBitmap.paintOpacity = Number(GameusScripts["Config"]["QuestSystem"]["Failed Image Opacity"] || 128);
        this.questBitmap.blt(this.failedImg, 0, 0, this.failedImg.width, this.failedImg.height, this.contentsWidth() / 2 - this.failedImg.width / 2, this.contentsHeight() / 2 - this.failedImg.height / 2);
      }
      if (this.completedImg !== '' && q.status === "completed") {
        this.questBitmap.paintOpacity = Number(GameusScripts["Config"]["QuestSystem"]["Completed Image Opacity"] || 128);
        this.questBitmap.blt(this.completedImg, 0, 0, this.completedImg.width, this.completedImg.height, this.contentsWidth() / 2 - this.completedImg.width / 2, this.contentsHeight() / 2 - this.completedImg.height / 2);
      }
    }
  };

  var _Window_QuestInfo_refresh = Window_QuestInfo.prototype.refresh;
  Window_QuestInfo.prototype.refresh = function() {
    _Window_QuestInfo_refresh.call(this);
  };

  Window_QuestInfo.prototype.drawQuestInfo = function(q) {
    var headerX = 0;
    this.questBitmap.paintOpacity = 255;
    var baseFontSize = this.questBitmap.fontSize, newFontSize = $fontSize;
    this.questBitmap.fontSize = newFontSize;
    this.lineY = 0;
    if (q.icon > -1) {
      this.drawIcon(q.icon, 0, this.lineY);
      headerX = 40;
    }
    this.questBitmap.textColor = this.systemColor();
    this.questBitmap.drawText(q.name, headerX, this.lineY, this.contentsWidth() - headerX, this.lineHeight());
    this.write();
    this.questBitmap.textColor = this.normalColor();
    var lines = this.sliceText(q.desc, this.contentsWidth() * (baseFontSize / newFontSize));
    for (var i = 0; i < lines.length; i += 1) {
      this.questBitmap.drawText(lines[i], 0, this.lineY, this.contentsWidth(), this.lineHeight());
      this.write();
    }
    this.write();
    this.questBitmap.fontSize = baseFontSize;
  };

  // Update the up/down arrows to indicate scrolling is available
  Window_QuestInfo.prototype.updateArrows = function() {
    var heightComparison = this.lineY - this.contentsHeight() - (this.lineHeight() + this.textPadding());
    this.downArrowVisible = (this.lineY > this.contentsHeight() && this.offY < heightComparison);
    this.upArrowVisible = this.offY > 0;
  };

  Window_QuestInfo.prototype.cursorDown = function(wrap) {
    var heightComparison = this.lineY - this.contentsHeight() - (this.lineHeight() + this.textPadding());
    if (this.lineY > this.contentsHeight() && this.offY < heightComparison) {
      SoundManager.playCursor();
      this.offY += this.lineHeight() + this.textPadding();
      this.refresh();
    }
  };

  Window_Quests.prototype.drawItem = function(index) {
    var item = this._list[index];
    var rect = this.itemRectForText(index);
    var align = this.itemTextAlign();
    this.resetTextColor();
    this.contents.fontSize = $fontSize;
    this.changePaintOpacity(this.isCommandEnabled(index));
    var tempX = 0;
    if (item.symbol === "quest") {
      var q = $gameQuests.get(Number(item.ext));
      if (q.icon > -1 && (GameusScripts["Config"]["QuestSystem"]["Use Icons"]).toLowerCase() === "true") {
        this.drawIcon(q.icon, rect.x - 5, rect.y + 2);
        tempX = 44;
      }
    }
    this.drawText(this.commandName(index), rect.x + tempX / 2, rect.y, rect.width, align);
    this.resetFontSettings();
  };

  Window_Quests.prototype.cursorRight = function(wrap) {
  };

  Window_Quests.prototype.cursorLeft = function(wrap) {
  };

  Window_QuestFilter.prototype.refresh = function() {
    this.contents.fontSize = $fontSize;
    if (this.filter == this.qFilters[this.filterIndex])
      return;
    this.filter = this.qFilters[this.filterIndex];
    this.contents.clear();
    this.drawText(this.filter, 0, 0, this.contentsWidth(), "center");
    this.resetFontSettings();
  };

  var _SceneMenu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
  Scene_Menu.prototype.createCommandWindow = function() {
    _SceneMenu_createCommandWindow.call(this);
    this._commandWindow.setHandler('questCommand', this.commandQuest.bind(this));
  };

  var _WindowMenuCommand_addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
  Window_MenuCommand.prototype.addOriginalCommands = function() {
    _WindowMenuCommand_addOriginalCommands.call(this);
    this.addCommand("Quest Command", 'questCommand', 1);
  };

})();
