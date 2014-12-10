/*global bootbox,$ */
// this['bootBoxWiz'] = {};
this.bootBoxWiz = {};
    
BootBoxWiz.TYPE_DYNAMIC = "dynamic";
BootBoxWiz.TYPE_FIXED = "fixed";

function BootBoxWiz(options) {
  options = options || {};

  this.onFinish = ((options.onFinish !== null && options.onFinish !== undefined) ? options.onFinish : function() {});

  this.title = ((options.title !== null && options.title !== undefined) ? options.title : 'Wizard');

  this.id = ((options.id !== null && options.id !== undefined) ? options.id : options.title.replace(/\W/g, ''));

  this.stepBaseId = ((options.stepBaseId !== null && options.stepBaseId !== undefined) ? options.stepBaseId : 'wizard');
  this.stepContent = ((options.stepContent !== null && options.stepContent !== undefined) ? options.stepContent : ['']);
  
  this.guideEnabled = ((options.guideEnabled !== null && options.guideEnabled !== undefined) ? options.guideEnabled : true);
  
  this.nbrSteps = this.stepContent.length;
  this.stepLogic = [];
  this.preProcessingLogic = [];
  this.stepContentSize = [];
  
  this.currentStep = 1;
}

BootBoxWiz.prototype.__defaultStepFunction = function() {
  return 0;
};

BootBoxWiz.prototype._doNothing = function() {
};

BootBoxWiz.prototype.launch = function() {
  var messageContent = '';
  var i;
  var xFreq = 1000 / this.nbrSteps;
  
  if(this.guideEnabled) {
    messageContent += 
      '<div class="stepwizard">' +
      '  <svg class="stepwizard-row" height="25px" viewBox="0 0 1000 50" style="width: inherit; height: inherit; padding-bottom:15px;">' +
      '    <line x1="0" y1="25" x2="1000" y2="25" style="stroke:darkgray; stroke-width:1" />';
    
    for(i = 0; i < this.nbrSteps; i++) {
      this.stepLogic[i] = this.__defaultStepFunction;
      this.preProcessingLogic[i] = this._doNothing;
      this.stepContentSize[i] = 1;
      messageContent += 
        '    <circle id="' + this.stepBaseId + 'StepInd' + i + '" cx="' + ((xFreq / 2) + (xFreq * i)) + '" cy="25" r="20" stroke="darkgray" stroke-width="1" fill="white" />' +
        '    <text id="' + this.stepBaseId + 'StepIndText' + i + '" text-anchor="middle" x="' + ((xFreq / 2) + (xFreq * i)) + '" y="25" style="font-size: 18; dominant-baseline: middle;" fill:"lightgray" >' + (i + 1) + '</text>';
    }

    messageContent += 
      '  </svg>' +
      '</div>';
  }

  messageContent += 
    '<div class="stepwizard row">  ' +
    '  <div class="col-md-12"> ' +
    '    <form id="' + this.id + '" class="form-horizontal"> ';
  
  var currentId = 0;
  for(i = 0; i < this.stepContent.length; i++) {
    if(this.stepContent[i] instanceof Object) {
      if(this.stepContent[i].content !== null && this.stepContent[i].content !== undefined) {
        this.preProcessingLogic[i] = ((this.stepContent[i].preProcessingLogic !== null && this.stepContent[i].preProcessingLogic) ? this.stepContent[i].preProcessingLogic : this._doNothing);
        
        if(this.stepContent[i].content instanceof Array) {
          // this.nbrSteps += this.stepContent[i].content.length - 1;
          this.stepLogic[i] = ((this.stepContent[i].logic !== null && this.stepContent[i].logic) ? this.stepContent[i].logic : this.__defaultStepFunction);
          this.stepContentSize[i] = this.stepContent[i].content.length;
          
          for(var j = 0; j < this.stepContent[i].content.length; j++) {
            messageContent += 
              '      <div class="row ' + this.stepBaseId + 'wizardContent" id="' + this.stepBaseId + 'Content' + (currentId++) + '">' +
              this.stepContent[i].content[j] +
              '      </div>';
          }
        } else {
          this.stepLogic[i] = this.__defaultStepFunction;
          this.stepContentSize[i] = 1;
          messageContent += 
            '      <div class="row ' + this.stepBaseId + 'wizardContent" id="' + this.stepBaseId + 'Content' + (currentId++) + '">' +
            this.stepContent[i].content +
            '      </div>';
        }
      }
    } else {
      this.preProcessingLogic[i] = this._doNothing;
      messageContent += 
        '      <div class="row ' + this.stepBaseId + 'wizardContent" id="' + this.stepBaseId + 'Content' + (currentId++) + '">' +
        this.stepContent[i] +
        '      </div>';
    }
  }
  
  messageContent += 
    '    </form>' +
    '  </div>' +
    '</div>';
    
  this.dialog = bootbox.dialog({
    title: this.title,
    message: messageContent,
    buttons: {
      previous: {
        label: "Previous",
        // className: "pull-left btn-default",
        className: "btn-default",
        callback: this.previousStep.bind(this)
      },
      next: {
        label: "Next",
        className: "btn-primary",
        // callback: function () {return this.nextStep()}.bind(this)
        callback: this.nextStep.bind(this)
      },
      finish: {
        label: "Finish",
        className: "",
        callback: this.onFinish
      }
    }
  });  

  // this.wizNavListItems = $('div.wizardNavPanel div a');
  // this.wizContent = $('.' + this.stepBaseId + 'wizardContent');
  this.currentWizPanel = 0;
  this.currentWizPanelStep = 0;

//    // listen for clicks on wizard nav buttons
//    wizNavListItems.on('click', function (e) {
//      e.preventDefault();
//      var $target = $($(this).attr('href'));
//      var $item = $(this);
//
//      if(!$item.hasClass('disabled')) {
//        this.wizNavListItems.removeClass('btn-primary').addClass('btn-default');
//        $item.addClass('btn-primary');
//        this.wizContent.hide();
//        $target.show();
//        $target.find('input:eq(0)').focus();
//      }
//    }.bind(this));

  this._hideAllSteps();
  this._showWizPanel(this.currentWizPanel);

  this.dialog.on("shown.bs.modal", function(dialog) {
    $('#title').focus();
    this._setPreviousDisabled(true);
    this._setFinishDisabled(true);
  }.bind(this));
};

BootBoxWiz.prototype.nextStep = function() {
  this.currentWizPanelStep++;
  this._hideWizPanel(this.currentWizPanel);
  this._applyPreProcessing();
  this._applyContentOffsets();
  this._showWizPanel(this.currentWizPanel);

  $('#title').focus();

  this._setPreviousDisabled(false);

  if(this.currentWizPanelStep === (this.nbrSteps - 1)) {
    this._setNextDisabled(true);
    this._setFinishDisabled(false);
  }

  return false;
};

BootBoxWiz.prototype.previousStep = function() {
  this.currentWizPanelStep--;
  this._hideWizPanel(this.currentWizPanel);
  this._applyContentOffsets();
  this._showWizPanel(this.currentWizPanel);

  $('#title').focus();

  this._setNextDisabled(false);
  this._setFinishDisabled(true);

  if(this.currentWizPanelStep === 0) {
    this._setPreviousDisabled(true);
  }

  return false;
};

BootBoxWiz.prototype._hideAllSteps = function() {
  $('.' + this.stepBaseId + 'wizardContent').hide();
};

BootBoxWiz.prototype._hideWizPanel = function(counter) {
  $('#' + this.stepBaseId + 'Content' + counter).hide();
  $('#' + this.stepBaseId + 'StepInd' + counter).attr("fill", "white");
  $('#' + this.stepBaseId + 'StepInd' + counter).attr("stroke", "darkgray");
  $('#' + this.stepBaseId + 'StepIndText' + counter).attr("fill", "lightgray");
};

BootBoxWiz.prototype._showWizPanel = function(counter) {
  $('#' + this.stepBaseId + 'Content' + counter).show();
  $('#' + this.stepBaseId + 'StepInd' + counter).attr("fill", "#428bca");
  $('#' + this.stepBaseId + 'StepInd' + counter).attr("stroke", "#428bca");
  $('#' + this.stepBaseId + 'StepIndText' + counter).attr("fill", "white");
  $('#title').focus();
};

BootBoxWiz.prototype._applyPreProcessing = function() {
  this.preProcessingLogic[this.currentWizPanelStep](this.getSerializedForm());
};

BootBoxWiz.prototype.getSerializedForm = function() {
  return $('#' + this.id).serializeObject();
};

BootBoxWiz.prototype._applyContentOffsets = function() {
  // using https://github.com/macek/jquery-serialize-object to serialize to an object
  var stepOffset = this.stepLogic[this.currentWizPanelStep](this.getSerializedForm());
  
  // iterate through previous steps and apply size
  var previousStepsOffset = 0;
  
  for(var i = 0; i < this.currentWizPanelStep; i++) {
    previousStepsOffset += this.stepContentSize[i] - 1;
  }
  
  this.currentWizPanel = previousStepsOffset + this.currentWizPanelStep + stepOffset;
};


BootBoxWiz.prototype._setPreviousDisabled = function(disable) {
  this._getBootBoxButton('previous').prop('disabled', disable);
};

BootBoxWiz.prototype._setNextDisabled = function(disable) {
  this._getBootBoxButton('next').prop('disabled', disable);
};

BootBoxWiz.prototype._setFinishDisabled = function(disable) {
  this._getBootBoxButton('finish').prop('disabled', disable);
};

BootBoxWiz.prototype._getBootBoxButton = function(label) {
  return $(".bootbox").find('button[data-bb-handler="' + label + '"]');
};