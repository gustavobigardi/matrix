import React, { useEffect } from "react";
import debounce from "lodash.debounce";

import SnackbarActions from "../../components/SnackbarActions";
import { showBrowserNotification } from "../../notification";
import { initEvents, emitEnterInRoom, closeConnection, saveCurrentUserRoom } from "../socket";

const useEvents = (
  onUpdateRooms,
  onSyncOffice,
  onAddUser,
  onRemoveUser,
  onUserEnterMeeting,
  onUserLeftMeeting,
  enqueueSnackbar,
  closeSnackbar,
  onOpenAnswerKnockDialog,
  setReceiveInviteOpen,
  setInvitation,
  isLoggedIn,
  rooms,
  settings,
  currentUser,
  currentRoom,
  onSetCurrentRoom,
  history
) => {
  useEffect(() => {
    if (isLoggedIn) {
      const events = initEvents(rooms);

      const showNotification = debounce(message => {
        if (!settings.notificationDisabled) {
          enqueueSnackbar(message, {
            action: key => (
              <SnackbarActions
                onDismiss={() => {
                  closeSnackbar(key);
                }}
              />
            )
          });
          showBrowserNotification(message);
        }
      }, 500);

      events.onAnswerKnockRoom((user, roomId) => {
        const room = rooms.find(r => r.id === roomId);
        onOpenAnswerKnockDialog(user, room);
      });
      events.onEnterRoomAllowed((user, roomId) => {
        const room = rooms.find(r => r.id === roomId);
        saveCurrentUserRoom(room.id);
        onSetCurrentRoom(room);
        onAddUser(currentUser, room.id);
        history.replace(`/morpheus/office/${room.id}`);
        setTimeout(() => {
          emitEnterInRoom(room.id);
        }, 1);
      });
      events.onUpdateRooms(onUpdateRooms);
      events.onSyncOffice(onSyncOffice);
      events.onParticipantJoined((user, roomId) => {
        onAddUser(user, roomId);
        if (currentUser.id !== user.id && currentRoom.id === roomId) {
          const room = rooms.find(r => r.id === roomId);
          // showNotification(`${user.name} entered ${room.name}.`);
        }
      });
      events.onParticipantStartedMeet((user, roomId) => {
        onUserEnterMeeting(user, roomId);
        if (currentUser.id !== user.id && currentRoom.id === roomId) {
          const audio = document.getElementById('audio-enter-meeting');
          audio.volume = 0.1;
          audio.play();
        }

      });
      events.onParticipantLeftMeet((user, roomId) => {
        onUserLeftMeeting(user, roomId);
      });
      events.onDisconnect(userId => {
        onRemoveUser(userId);
      });
      events.onParticipantIsCalled((user, roomId) => {
        const room = rooms.find(r => r.id === roomId);
        setReceiveInviteOpen(true);
        setInvitation({ user, room });
        if (!settings.notificationDisabled) {
          showBrowserNotification(
            `${user.name} is inviting you to ${room.name}`
          );
        }
      });
    }

    return () => {
      closeConnection();
    };
  }, [
    closeSnackbar,
    currentRoom.id,
    currentUser.id,
    enqueueSnackbar,
    isLoggedIn,
    onAddUser,
    onRemoveUser,
    onUpdateRooms,
    onSyncOffice,
    onUserEnterMeeting,
    onUserLeftMeeting,
    rooms,
    setInvitation,
    setReceiveInviteOpen,
    settings.notificationDisabled
  ]);
};

export default useEvents;
