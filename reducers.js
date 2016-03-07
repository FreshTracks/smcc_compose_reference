"use strict";


((root, _, ActionTypes) => {


const {
  cond,
  eq,
  isUndefined,
  map,
  merge,
  set,
} = _;


const {
  DESCRIPTION_INPUT,
  DETECT_SHARED_LINK,
  DISMISS_SHARED_LINK,
  FETCHED_BROADCAST_PLACARD_COUNTS,
  FETCHED_CHANNELS,
  FETCHED_PROCURE_POST_ASSETS,
  FETCHED_PUBLISHABLE_GROUPS,
  FETCHED_PUBLISHABLE_USERS,
  FETCHED_PUBLISHABLE_SUBCHANNELS,
  MESSAGE_INPUT,
  PICTURE_INPUT,
  POST_MODE_CHANGE,
  RECIPIENT_SELECTION_ITEM_CHANGE,
  RECIPIENTS_DROPDOWN_TOGGLE,
  REFOCUS_INPUT,
  TITLE_INPUT,
} = ActionTypes;


const handleActions = (actionHandlers, initalState) => (state, action) => {
  const initialHandler = [
    ([state]) => isUndefined(state),
    () => initalState,
  ];

  const fallbackHandler = [
    () => true,
    ([state]) => state,
  ];

  const buildActionHandler = ([handlerType, handlerFn]) => [
    ([state, action]) => eq(handlerType, action.type),
    ([state, action]) => handlerFn(state, action),
  ];

  const handlers = [initialHandler, ...map(buildActionHandler, actionHandlers), fallbackHandler];

  return cond(handlers)([state, action]);
};


const mergeActionPayload = (state, action) => merge(state, action.payload);


const dismissSharedLink = (state) => {
  const { dismissedLinks, postAssets: { message, sharedLink, picture } } = state;

  const setDismissedLinks = set("dismissedLinks", [...dismissedLinks, sharedLink]);
  const setPostAssets     = set("postAssets", {message, picture, sharedLink: null});

  return setPostAssets(setDismissedLinks(state));
};


const broadcastComposerState = handleActions([
  [DESCRIPTION_INPUT,           mergeActionPayload],
  [DETECT_SHARED_LINK,          mergeActionPayload],
  [DISMISS_SHARED_LINK,         dismissSharedLink],
  [FETCHED_CHANNELS,            mergeActionPayload],
  [FETCHED_PROCURE_POST_ASSETS, mergeActionPayload],
  [MESSAGE_INPUT,               mergeActionPayload],
  [PICTURE_INPUT,               mergeActionPayload],
  [REFOCUS_INPUT,               mergeActionPayload],
  [TITLE_INPUT,                 mergeActionPayload],
], {
  channels: {},
  dismissedLinks: [],
  postAssets: {},
  refocusInput: {},
});


const recipientSelectorState = handleActions([
  [FETCHED_BROADCAST_PLACARD_COUNTS, (state, action) => set([state.postMode, "placardCounts"], action.payload, state)],
  [FETCHED_CHANNELS,                  mergeActionPayload],
  [FETCHED_PUBLISHABLE_GROUPS,        mergeActionPayload],
  [FETCHED_PUBLISHABLE_SUBCHANNELS,   mergeActionPayload],
  [FETCHED_PUBLISHABLE_USERS,         mergeActionPayload],
  [POST_MODE_CHANGE,                  mergeActionPayload],
  [RECIPIENTS_DROPDOWN_TOGGLE,        mergeActionPayload],
  [RECIPIENT_SELECTION_ITEM_CHANGE,   mergeActionPayload],
], {
  channels: {},
  postMode: "socialPost",
  recipientsDropdownToggle: false,
  socialBlast: {selections: {}, publishable: {}, placardCounts: {}},
  socialPost:  {selections: {}, publishable: {}, placardCounts: {}},
});


root.Reducers = {
  broadcastComposerState,
  recipientSelectorState,
};


})(window, window._, window.ActionTypes);
