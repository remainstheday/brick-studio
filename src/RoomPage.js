import {
  faSquare,
  faThLarge,
  faUserFriends,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DisplayContext, LiveKitRoom } from "@livekit/react-components";
import { RoomEvent, setLogLevel, VideoPresets } from "livekit-client";
import { useState } from "react";
import "react-aspect-ratio/aspect-ratio.css";
import { useLocation, useNavigate } from "react-router-dom";

export const RoomPage = () => {
  const [numParticipants, setNumParticipants] = useState(0);
  const [displayOptions, setDisplayOptions] = useState({
    stageLayout: "grid",
    showStats: false,
  });
  const navigate = useNavigate();
  const query = new URLSearchParams(useLocation().search);
  const url = process.env.REACT_APP_WEBSOCKET_URL;
  const token = process.env.REACT_APP_ACCESS_TOKEN;
  const recorder = query.get("recorder");

  if (!url || !token) {
    return <div>url and token are required</div>;
  }

  const onLeave = () => {
    navigate("/");
  };

  const updateParticipantSize = (room) => {
    setNumParticipants(room.participants.size + 1);
  };

  const onParticipantDisconnected = (room) => {
    updateParticipantSize(room);

    /* Special rule for recorder */
    if (
      recorder &&
      parseInt(recorder, 10) === 1 &&
      room.participants.size === 0
    ) {
      console.log("END_RECORDING");
    }
  };

  const updateOptions = (options) => {
    setDisplayOptions({
      ...displayOptions,
      ...options,
    });
  };

  return (
    <DisplayContext.Provider value={displayOptions}>
      <div className="roomContainer">
        <div className="topBar">
          <h2>LiveKit Video</h2>
          <div className="right">
            <div>
              <input
                id="showStats"
                type="checkbox"
                onChange={(e) => updateOptions({ showStats: e.target.checked })}
              />
              <label htmlFor="showStats">Show Stats</label>
            </div>
            <div>
              <button
                className="iconButton"
                disabled={displayOptions.stageLayout === "grid"}
                onClick={() => {
                  updateOptions({ stageLayout: "grid" });
                }}
              >
                <FontAwesomeIcon height={32} icon={faThLarge} />
              </button>
              <button
                className="iconButton"
                disabled={displayOptions.stageLayout === "speaker"}
                onClick={() => {
                  updateOptions({ stageLayout: "speaker" });
                }}
              >
                <FontAwesomeIcon height={32} icon={faSquare} />
              </button>
            </div>
            <div className="participantCount">
              <FontAwesomeIcon icon={faUserFriends} />
              <span>{numParticipants}</span>
            </div>
          </div>
        </div>
        <LiveKitRoom
          url={url}
          token={token}
          onConnected={(room) => {
            setLogLevel("debug");
            onConnected(room, query);
            room.on(RoomEvent.ParticipantConnected, () =>
              updateParticipantSize(room)
            );
            room.on(RoomEvent.ParticipantDisconnected, () =>
              onParticipantDisconnected(room)
            );
            updateParticipantSize(room);
          }}
          roomOptions={{
            adaptiveStream: isSet(query, "adaptiveStream"),
            dynacast: isSet(query, "dynacast"),
            publishDefaults: {
              simulcast: isSet(query, "simulcast"),
            },
            videoCaptureDefaults: {
              resolution: VideoPresets.h720.resolution,
            },
          }}
          onLeave={onLeave}
        />
      </div>
    </DisplayContext.Provider>
  );
};

async function onConnected(room, query) {
  // make it easier to debug
  window.currentRoom = room;

  if (isSet(query, "audioEnabled")) {
    const audioDeviceId = query.get("audioDeviceId");
    if (audioDeviceId && room.options.audioCaptureDefaults) {
      room.options.audioCaptureDefaults.deviceId = audioDeviceId;
    }
    await room.localParticipant.setMicrophoneEnabled(true);
  }

  if (isSet(query, "videoEnabled")) {
    const videoDeviceId = query.get("videoDeviceId");
    if (videoDeviceId && room.options.videoCaptureDefaults) {
      room.options.videoCaptureDefaults.deviceId = videoDeviceId;
    }
    await room.localParticipant.setCameraEnabled(false);
    await room.localParticipant.setScreenShareEnabled(true);
  }
}

function isSet(query, key) {
  return query.get(key) === "1" || query.get(key) === "true";
}
