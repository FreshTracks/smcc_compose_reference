"use strict";

((root, _, ActionTypes) => {


const {
  debounce,
  difference,
  eq,
  filter,
  flow,
  fromPairs,
  get,
  isFunction,
  keys,
  map,
  mapKeys,
  mapValues,
  pickBy,
  sortBy,
} = _;


const {
  DESCRIPTION_INPUT,
  DETECT_SHARED_LINK,
  DISMISS_SHARED_LINK,
  FETCHED_BROADCAST_RECIPIENT_COUNTS,
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


root.ActionCreators = {
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
};


const sortByName = sortBy("name");
const sortBySubchannelHierarchy = sortBy(["channel_name", "primary_subchannel_id", "type", "name"]);


const actionDebounce = (wait, actionCreator) => {
  const debouncedAction = debounce(wait, (actionArgs, [dispatch, getState]) => {
    const action =  actionCreator(...actionArgs);
    return isFunction(action) ? action(dispatch, getState) : dispatch(action);
  });
  return (...actionArgs) => (...thunkArgs) => debouncedAction(actionArgs, thunkArgs);
};


const debouncedOnDetectSharedLink = actionDebounce(1000, (extractUris, procurePostAssets, message) => (dispatch, getState) => {
  const { postAssets: { sharedLink }, dismissedLinks } = getState();
  const detectedSharedLink = difference(extractUris(message), dismissedLinks)[0];

  if (sharedLink || !detectedSharedLink) {
    return;
  }

  dispatch({type: DETECT_SHARED_LINK, payload: { postAssets: {sharedLink: detectedSharedLink} }});

  procurePostAssets(detectedSharedLink).done(postAssetsJson => {
    dispatch(onFetchedProcurePostAssets(postAssetsJson.data));
  });
});


const debouncedOnFetchedBroadcastRecipientCounts = actionDebounce(0, (fetchRecipientCounts) => (dispatch, getState) => {
  const { postMode, socialBlast, socialPost } = getState();
  const { selections } = {socialBlast, socialPost}[postMode];
  const selectedIdsFn  = flow(mapKeys((type) => `selected_${type}_ids`),
                              mapValues(flow(pickBy(eq(true)), keys)));
  fetchRecipientCounts(selectedIdsFn(selections)).done((recipientCountsJson) => {
    dispatch({
      type: FETCHED_BROADCAST_RECIPIENT_COUNTS,
      payload: recipientCountsJson.data
    });
  });
});


function onChannelFilterItemChange(fetchRecipientCounts, channelId, isSelected) {
  return (dispatch) => {
    dispatch(onRecipientSelectionItemChange(fetchRecipientCounts,
                                            "channel",
                                            isSelected,
                                            [channelId]));
  };
}


function onDescriptionInput(selector, cursorPosition, description) {
  const action = {
    type: DESCRIPTION_INPUT,
    payload: { postAssets: { description } },
  };
  return onRefocusInput(selector, cursorPosition, action);
}


function onDismissSharedLink() {
  return { type: DISMISS_SHARED_LINK };
}


function onFetchedChannels(channelsJson) {
  return { type: FETCHED_CHANNELS, payload: {channels: sortByName(channelsJson.data)} };
}


function onFetchedProcurePostAssets(postAssets) {
  return { type: FETCHED_PROCURE_POST_ASSETS, payload: {postAssets} };
}


function onFetchedPublishableGroups(publishableGroupsJson) {
  return {
    type: FETCHED_PUBLISHABLE_GROUPS,
    payload: {
      socialBlast: {
        publishable: {
          group: sortByName(publishableGroupsJson.data),
        }
      }
    }
  };
}


function onFetchedPublishableSubchannels(publishableSubchannelsJson) {
  return {
    type: FETCHED_PUBLISHABLE_SUBCHANNELS,
    payload: {
      socialPost: {
        publishable: {
          subchannel: sortBySubchannelHierarchy(publishableSubchannelsJson.data),
        }
      }
    }
  };
}


function onFetchedPublishableUsers(publishableUsersJson) {
  return {
    type: FETCHED_PUBLISHABLE_USERS,
    payload: {
      socialBlast: {
        publishable: {
          user: sortByName(publishableUsersJson.data),
        }
      }
    }
  };
}


function onMessageInput(selector, cursorPosition, message) {
  const action = {
    type: MESSAGE_INPUT,
    payload: { postAssets: { message } }
  };
  return onRefocusInput(selector, cursorPosition, action);
}


function onMessageInputWithLinkDetection(extractUris, procurePostAssets, selector, cursorPosition, message) {
  return (dispatch) => {
    dispatch(onMessageInput(selector, cursorPosition, message));
    dispatch(debouncedOnDetectSharedLink(extractUris, procurePostAssets, message));
  };
}


function onPictureInput(selector, cursorPosition, picture) {
  const action = {
    type: PICTURE_INPUT,
    payload: { postAssets: { picture } },
  };
  return onRefocusInput(selector, cursorPosition, action);
}


function onPostModeChange(postMode) {
  return {
    type: POST_MODE_CHANGE,
    payload: { postMode }
  };
}


function onQuickpickSubchannelItemChange(fetchRecipientCounts, channelName, isSelected) {
  return (dispatch, getState) => {
    const { postMode, socialBlast, socialPost } = getState();
    const { publishable: { subchannel: publishableSubchannels } } = {socialBlast, socialPost}[postMode];
    const subchannelIds = map(get("id"), filter(flow(get("channel_name"), eq(channelName)), publishableSubchannels));

    dispatch(onRecipientSelectionItemChange(fetchRecipientCounts,
                                            "subchannel",
                                            isSelected,
                                            subchannelIds));
  };
}


function onRecipientsDropdownToggle() {
  return (dispatch, getState) => {
    const { recipientsDropdownToggle } = getState();
    const action = {
      type: RECIPIENTS_DROPDOWN_TOGGLE,
      payload: {
        recipientsDropdownToggle: !recipientsDropdownToggle
      }
    };
    dispatch(action);
  };
}


function onRecipientSelectionItemChange(fetchRecipientCounts, recipientSelectionType, recipientIsSelected, recipientSelectionIds) {
  return (dispatch, getState) => {
    const { postMode } = getState();

    dispatch({
      type: RECIPIENT_SELECTION_ITEM_CHANGE,
      payload: {
        [postMode]: {
          selections: {
            [recipientSelectionType]: fromPairs(map((id) => [id, recipientIsSelected], recipientSelectionIds))
          }
        }
      }
    });

    dispatch(debouncedOnFetchedBroadcastRecipientCounts(fetchRecipientCounts));
  };
}


function onRefocusInput(selector, cursorPosition, action) {
  return (dispatch) => {
    const refocusInputAction = {type: REFOCUS_INPUT, payload: { refocusInput: {selector, cursorPosition}}};
    dispatch(refocusInputAction);
    dispatch(action);
  };
}


function onTitleInput(selector, cursorPosition, title) {
  const action = {
    type: TITLE_INPUT,
    payload: { postAssets: { title } },
  };
  return onRefocusInput(selector, cursorPosition, action);
}


})(window, window._, window.ActionTypes);
