"use strict";

((root, _) => {

const {
  chunk,
  eq,
  flatMap,
  get,
  join,
  map,
  reduce,
  toPairs,
} = _;


const isZero        = eq(0);
const isSocialPost  = eq("socialPost");
const isSocialBlast = eq("socialBlast");
const joinMarkup    = join("");


root.Templates = {
  Example1,
  Example2,
};


function Example1({channels, postMode, recipientsDropdownToggle, socialBlast, socialPost}) {
  const { publishable, selections, recipientCounts } = {socialBlast, socialPost}[postMode];

  return BSCard({cardHeader: "Example 1 - Recipient Selector"},
                RecipientSelector(PostModeSelector(postMode),
                                  RecipientCountList(recipientCounts),
                                  RecipientsDropdown({recipientsDropdownToggle},
                                                     RecipientSelectionTools(channels,
                                                                             postMode,
                                                                             publishable,
                                                                             selections),
                                                     RecipientSelectionList(publishable,
                                                                            selections))));
}


function Example2(effectiveMsgCharCount, {channels, postAssets}) {
  return BSCard({cardHeader: "Example 2 - Post Preview"},
                BroadcastComposer(postAssets),
                ChannelPreviewList(effectiveMsgCharCount, channels, postAssets));
}


function RecipientSelector(postModeSelector, recipientCountList, recipientsDropdown) {
  return (`
    <div class="${RecipientSelector.name}">
      <div class="btn-toolbar">
        <div class="btn-group" data-toggle="buttons">
          ${postModeSelector}
          ${recipientsDropdown}
        </div>
        ${recipientCountList}
      </div>
    </div>
  `);
}


function PostModeSelector(postMode) {
  return (`
    <div class="${PostModeSelector.name} btn-group">
      <label class="btn btn-secondary ${isSocialPost(postMode) && 'active'}">
        <input type="radio" name="options" data-post-mode="socialPost" ${isSocialPost(postMode) && 'checked'}>
        SocialPost
      </label>
      <label class="btn btn-secondary ${isSocialBlast(postMode) && 'active'}">
        <input type="radio" name="options" data-post-mode="socialBlast" ${isSocialBlast(postMode) && 'checked'}>
        SocialBlast
      </label>
    </div>
  `);
}


const RecipientCountList = (recipientCounts) => {
  return (`
    <div class="btn-group dropdown">
      ${joinMarkup(map(RecipientCountItem, recipientCounts))}
    </div>
  `);
};


const RecipientCountItem = ([channelName, count]) => (`
  <div class="${RecipientCountItem.name} btn btn-secondary btn-no-intercation">
    ${SocialIcon(channelName)}
    <span class="label label-default">${count}</span>
  </div>
`);


function RecipientsDropdown({recipientsDropdownToggle}, recipientSelectionTools, recipientSelectionList) {
  return (`
    <div class="${RecipientsDropdown.name} ${recipientsDropdownToggle && "open"} btn-group dropdown">
      <button class="${recipientsDropdownToggle && "active"} btn btn-secondary dropdown-toggle">Recipients</button>
      <div class="dropdown-menu dropdown-keepopen">
        ${recipientSelectionTools}
        <div class="dropdown-divider"></div>
        ${recipientSelectionList}
      </div>
    </div>
  `);
}


function RecipientSelectionTools(channels, postMode, publishable, selections) {
  return isSocialPost(postMode) ? QuickpickSubchannelList(publishable, selections) : ChannelFilterList(channels, selections);
}


function QuickpickSubchannelList(publishable, selections) {
  const {subchannel: publishableSubchannels = []} = publishable;
  const {subchannel: subchannelSelections   = {}} = selections;

  const quickPickSubchannelItems = reduce((quickPicks, {id, channel_name}) => {
    if (quickPicks[channel_name] !== false) {
      quickPicks[channel_name] = subchannelSelections[id] || false;
    }
    return quickPicks;
  }, {}, publishableSubchannels);

  return (`
    <div class="row">
      <div class="btn-group col-sm-offset-1">
        ${joinMarkup(map(QuickpickSubchannelItem, toPairs(quickPickSubchannelItems)))}
      </div>
    </div>
  `);
}


function QuickpickSubchannelItem([channelName, isSelected]) {
  return (`
    <div class="${QuickpickSubchannelItem.name} btn-group"
         data-channel-name="${channelName}">
      <label class="btn btn-secondary btn-sm">
        <input type="checkbox" ${isSelected && 'checked'}/>
        ${SocialIcon(channelName)}
      </label>
    </div>
  `);
}


function ChannelFilterList(channels, selections) {
  const {channel: channelSelections = {}} = selections;
  const channelFilterItems = map(({id, name}) => {
    return ChannelFilterItem(id, name, !!channelSelections[id]);
  }, channels);

  return (`
    <div class="row">
      <div class="btn-group col-sm-offset-1">
        ${joinMarkup(channelFilterItems)}
      </div>
    </div>
  `);
}


function ChannelFilterItem(channelId, channelName, isSelected) {
  return (`
    <div class="${ChannelFilterItem.name} btn-group"
         data-channel-id="${channelId}">
      <label class="btn btn-secondary btn-sm">
        <input type="checkbox" ${isSelected && 'checked'}/>
        ${SocialIcon(channelName)}
      </label>
    </div>
  `);
}


function RecipientSelectionList(publishable, selections) {
  const recipientSelectionItems = flatMap(([itemType, items]) => map((item) => {
    const isItemSelected = !!get([itemType, item.id], selections);
    return RecipientSelectionItem(itemType, isItemSelected, item);
  }, items), toPairs(publishable));

  return joinMarkup(recipientSelectionItems);
}


function RecipientSelectionItem(itemType, isItemSelected, {id, name, channel_name, type: subchannel_type}) {
  return (`
    <div class="${RecipientSelectionItem.name} dropdown-item"
         data-recipient-selection-id="${id}"
         data-recipient-selection-type="${itemType}">
      <label>
        <input type="checkbox" ${isItemSelected && 'checked'}/>
        ${SocialIcon(channel_name, itemType, subchannel_type)}
        ${name}
      </label>
    </div>
  `);
}


function BroadcastComposer({message, picture, sharedLink, title, description}) {
  return BSCardSM({cardHeader: BroadcastComposer.name}, (`
    <div class="row">
      <div class="col-sm-6">
        ${Message(message)}
      </div>
      <div class="col-sm-6">
        ${Picture(picture)}
        ${SharedLink(sharedLink)}
        ${Title(sharedLink, title)}
        ${Description(sharedLink, description)}
      </div>
    </div>
  `));
}


function Message(message = "") {
  return (`
    <fieldset class="form-group row">
      <div class="col-sm-12">
        <textarea class="${Message.name} form-control"
                  data-refocus-selector="${Message.name}"
                  rows="10">${message}</textarea>
      </div>
    </fieldset>
  `);
}


function Picture(picture = "") {
  return (`
    <div class="form-group row">
      <div class="col-sm-2 form-control-label">
        ${Picture.name}
      </div>
      <div class="col-sm-8">
        <input class="${Picture.name} form-control"
               data-refocus-selector="${Picture.name}"
               value="${picture}"
               type="text">
      </div>
    </div>
  `);
}


function SharedLink(sharedLink) {
  const sharedLinkDisplay = sharedLink || "";
  const dismissSharedLink = sharedLink ? DismissSharedLink() : "";

  return (`
    <div class="form-group row">
      <div class="col-sm-2 form-control-label">
        ${SharedLink.name}
      </div>
      <div class="col-sm-8">
        <input class="${SharedLink.name} form-control"
               data-refocus-selector="${SharedLink.name}"
               placeholder="${sharedLinkDisplay}"
               readonly
               type="text">
      </div>
      <div class="col-sm-2">
        ${dismissSharedLink}
      </div>
    </div>
  `);
}


function DismissSharedLink() {
  return (`
    <button class="${DismissSharedLink.name} btn btn-danger">
      <i class="fa fa-remove"></i>
    </button>
  `);
}


function Title(sharedLink, title = "") {
  const isReadOnly   = sharedLink ? '' : 'readonly';

  return (`
    <div class="form-group row">
      <div class="col-sm-2 form-control-label">
        ${Title.name}
      </div>
      <div class="col-sm-8">
        <input class="${Title.name} form-control"
               data-refocus-selector="${Title.name}"
               value="${title}"
               ${isReadOnly}
               type="text">
      </div>
    </div>
  `);
}


function Description(sharedLink, description = "") {
  const isReadOnly  = sharedLink ? '' : 'readonly';

  return (`
    <div class="form-group row">
      <div class="col-sm-2 form-control-label">
        ${Description.name}
      </div>
      <div class="col-sm-8">
        <textarea class="${Description.name} form-control" ${isReadOnly}
                  data-refocus-selector="${Description.name}"
                  rows="3">${description}</textarea>
      </div>
    </div>
  `);
}



function ChannelPreviewList(effectiveMsgCharCount, channels, postAssets) {
  const channelPreviews = map(({name}) => {
    return ChannelPreviewItem(name, effectiveMsgCharCount(name, postAssets));
  }, channels);

  const channelPreviewGroups = map(join(""), chunk(2, channelPreviews));

  return (`
    <div class="card-group">
    ${join('</div><div class="card-group">', channelPreviewGroups)}
    </div>
  `);
}


function ChannelPreviewItem(channelName, charCount) {
  const cardHeader = `${SocialIcon(channelName)} ${ChannelCharCountLabel(charCount)}`;
  return BSCardSM({cardHeader}, (`
    <div class="${ChannelPreviewItem.name} ${channelName}"/>
  `));
}


function ChannelCharCountLabel(charCount = [0,0]) {
  const [used, total] = charCount;

  let lableClass;

  if (isZero(used)) {
    lableClass = "label-default";
  } else if (isZero(total)) {
    lableClass = "label-success";
  } else if (used > total) {
    lableClass = "label-danger";
  } else if (used + 10 > total) {
    lableClass = "label-warning";
  } else {
    lableClass = "label-success";
  }

  return (`
    <span class="label ${lableClass}">
      <i class="fa fa-comment"></i>
      ${used} / ${isZero(total) ? "&infin;" : total}
    </span>
  `);
}


function SocialIcon(channelName, type = "subchannel", subchannelType = 0) {
  return (`
    <i class="${SocialIcon.name} fa ${type} ${channelName} subchannel-type-${subchannelType}"></i>
  `);
}


function BSCard({cardHeader}, ...children) {
  return (`
    <div class="card">
      <div class="card-header">${cardHeader}</div>
      <div class="card-block">
        ${joinMarkup(children)}
      </div>
    </div>
  `);
}


function BSCardSM({cardHeader}, ...children) {
  return (`
    <div class="card card-block">
      <h6 class="card-title text-muted">${cardHeader}</h6>
      ${joinMarkup(children)}
    </div>
  `);
}


})(window, window._);
