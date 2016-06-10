"use strict";

const pp = (val) => { console.log(JSON.stringify(val, null, 2)); return val; };

((window) => {


const {
  $,
  _,
  ActionCreators,
  console,
  LumSoc,
  Reducers,
  Redux,
  ReduxThunk,
  reduxLogger,
  Templates,
} = window;


const {
  debounce,
  map,
  merge,
} = _;


const {
  onChannelFilterItemChange,
  onDescriptionInput,
  onDismissSharedLink,
  onFetchedChannels,
  onFetchedPublishableGroups,
  onFetchedPublishableSubchannels,
  onFetchedPublishableUsers,
  onMessageInputWithLinkDetection,
  onPictureInput,
  onPostModeChange,
  onQuickpickSubchannelItemChange,
  onRecipientsDropdownToggle,
  onRecipientSelectionItemChange,
  onTitleInput,
} = ActionCreators;


const $hasInputChecked = (el) => !!$(el).has("input:checked").length;


const CreateReduxStore = (reducer, color) => {
  return Redux.createStore(reducer, Redux.applyMiddleware(ReduxThunk.default, reduxLogger({colors: {title: () => color}})));
};


const Api = ({api_host, api_token}) => {
  const getJSON = (endpoint, data) => $.getJSON(api_host + endpoint, merge({api_token: api_token}, data));

  return {
    fetchChannels:               () => getJSON("/channels"),
    fetchPublishableGroups:      () => getJSON("/groups/publishable"),
    fetchPublishableSubchannels: () => getJSON("/subchannels/publishable"),
    fetchPublishableUsers:       () => getJSON("/users/publishable"),
  };
};


const INPUT_DEBOUNCE  = 300;
const RENDER_DEBOUNCE = 0;


const api_host  = "//marcom-dev.sm.cc/api/";
const api_token = "wy6H8xRL-61PEQEwc7mC";


const {
  fetchChannels,
  fetchPublishableGroups,
  fetchPublishableSubchannels,
  fetchPublishableUsers,
} = Api({api_host, api_token});

const {
  extractUris,
  effectiveMsgCharCount,
  postPreview,
} = LumSoc.init();

const {
  procurePostAssets,
  recipientCounts,
} = LumSoc.init().endpoints({api_host, api_token});


function renderExample1($root, store) {
  return () => {
    console.info("Render: Example1");
    const state = store.getState();
    $root.html(Templates.Example1(state));
  };
}


function mainExample1() {
  console.info("Run: Example1");



  const $root = $(".Example1");
  const store = CreateReduxStore(Reducers.recipientSelectorState, "DarkGreen");



  // Setup render callback
  store.subscribe(debounce(RENDER_DEBOUNCE, renderExample1($root, store)));



  // Attach Event Listeners
  $root.on("change", ".RecipientSelectionItem", ({currentTarget}) => {
    const {recipientSelectionType, recipientSelectionId} = $(currentTarget).data();
    store.dispatch(onRecipientSelectionItemChange(recipientCounts,
                                                  recipientSelectionType,
                                                  $hasInputChecked(currentTarget),
                                                  [recipientSelectionId]));
  });

  $root.on("change", ".QuickpickSubchannelItem", ({currentTarget}) => {
    const { channelName } = $(currentTarget).data();
    store.dispatch(onQuickpickSubchannelItemChange(recipientCounts,
                                                   channelName,
                                                   $hasInputChecked(currentTarget)));
  });

  $root.on("change", ".ChannelFilterItem", ({currentTarget}) => {
    const { channelId } = $(currentTarget).data();
    store.dispatch(onChannelFilterItemChange(recipientCounts,
                                             channelId,
                                             $hasInputChecked(currentTarget)));
  });

  $root.on("click", ".RecipientsDropdown .dropdown-toggle", () => {
    store.dispatch(onRecipientsDropdownToggle());
  });

  $root.on("change", ".PostModeSelector", ({target}) => {
    store.dispatch(onPostModeChange($(target).data("postMode")));
  });



  // Fire initial api requests
  $.when(fetchChannels(),
         fetchPublishableGroups(),
         fetchPublishableUsers(),
         fetchPublishableSubchannels()
  ).done(([channelsJson], [publishableGroupsJson], [publishableUsersJson], [publishableSubchannelsJson]) => {
    store.dispatch(onFetchedChannels(channelsJson));
    store.dispatch(onFetchedPublishableGroups(publishableGroupsJson));
    store.dispatch(onFetchedPublishableUsers(publishableUsersJson));
    store.dispatch(onFetchedPublishableSubchannels(publishableSubchannelsJson));
  });

}


function renderExample2($root, store) {
  return () => {
    console.info("Render: Example2");

    const state = store.getState();

    $root.html(Templates.Example2(effectiveMsgCharCount, state));

    if (state.refocusInput.selector) {
      $root.find(`[data-refocus-selector='${state.refocusInput.selector}']`).focus()[0].setSelectionRange(state.refocusInput.cursorPosition,state.refocusInput.cursorPosition);
    }

    map(({name: channelName}) => {
      postPreview(channelName, state.postAssets, {targetElement: `.ChannelPreviewItem.${channelName}`});
    }, state.channels);
  };
}


function mainExample2() {
  console.info("Run: Example2");



  const $root = $(".Example2");
  const store = CreateReduxStore(Reducers.broadcastComposerState, "DarkRed");



  // Setup render callback
  store.subscribe(debounce(RENDER_DEBOUNCE, renderExample2($root, store)));



  // Attach Event Listeners
  $root.on("input", ".Message", debounce(INPUT_DEBOUNCE, ({target}) => {
    store.dispatch(onMessageInputWithLinkDetection(extractUris, procurePostAssets, $(target).data("refocusSelector"), target.selectionStart, target.value));
  }));

  $root.on("input", ".Picture", debounce(INPUT_DEBOUNCE, ({target}) => {
    store.dispatch(onPictureInput($(target).data("refocusSelector"), target.selectionStart, target.value));
  }));

  $root.on("input", ".Title", debounce(INPUT_DEBOUNCE, ({target}) => {
    store.dispatch(onTitleInput($(target).data("refocusSelector"), target.selectionStart, target.value));
  }));

  $root.on("input", ".Description", debounce(INPUT_DEBOUNCE, ({target}) => {
    store.dispatch(onDescriptionInput($(target).data("refocusSelector"), target.selectionStart, target.value));
  }));

  $root.on("click", ".DismissSharedLink", () => {
    store.dispatch(onDismissSharedLink());
  });




  // Fire initial api requests
  $.when(fetchChannels()).done((channelsJson) => {
    store.dispatch(onFetchedChannels(channelsJson));
  });
}

mainExample1(); // Run Example1.
mainExample2(); // Run Example2.

})(window);

