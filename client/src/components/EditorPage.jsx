import React, { useEffect, useRef, useState } from "react";
import Client from "./Client";
import Editor from "./Editor";
import { initSocket } from "../Socket";
import { ACTIONS } from "../Actions";
import {
  useNavigate,
  useLocation,
  Navigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";

function EditorPage() {
  const [clients, setClients] = useState([]);

  const codeRef = useRef(null);

  const Location = useLocation();
  const navigate = useNavigate();
  const { roomId } = useParams();

  const socketRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      const handleErrors = (err) => {
        console.log("Error", err);
        toast.error("Socket connection failed, Try again later");
        navigate("/");
      };

      socketRef.current.emit("join", {
        roomId,
        username: Location.state?.username,
      });
      socketRef.current.on('joined',({clients, username,socketId})=>{
        if(username !==Location.state?.username ){
          toast.success(`${username} joined`)
        }
        setClients(clients);
        socketRef.current.emit('sync-code',{
          code:codeRef.current,
          socketId,
        });
      });
     
    socketRef.current.on('disconnected',({socketId,username})=>{
      toast.success(`${username} left the room`);
      //now we have to update setClients also
      setClients((prev)=>{ //prev will take all the previous values
         return prev.filter((client)=>{
          client.socketId =! socketId // prev mai jo socket id iske equal nhi h usko rakho baaki hata do
         })
      })
    })
    };
    init();
    // we also have to close all the listeners that we have called in 
    return () => {
      socketRef.current && socketRef.current.disconnect();
      socketRef.current.off('joined');
      socketRef.current.off('disconnected');
    };
  }, []);

  if (!Location.state) {
    return <Navigate to="/" />;
  }

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId); // copies to clipboard of computer
      toast.success(`Room ID is copied`);
    } catch (error) {
      console.log(error);
      toast.error("Unable to copy the room ID");
    }
  };

  const leaveRoom = async () => {
    navigate("/");
  };


  return (
    <div className="container-fluid vh-100 d-flex flex-column">
      <div className="row flex-grow-1">
        {/* Client panel */}
        <div className="col-md-2 bg-dark text-light d-flex flex-column">
          <img
            src="/favicon.ico"
            alt="Logo"
            className="img-fluid mx-auto"
            style={{ maxWidth: "150px", marginTop: "8px" }}
          />
          <hr style={{ marginTop: "1rem" }} />

          {/* Client list container */}
          <div className="d-flex flex-column flex-grow-1 overflow-auto">
            <span className="mb-2">Members</span>
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>

          <hr />
          {/* Buttons */}
          <div className="mt-auto mb-3">
            <button className="btn btn-success w-100 mb-2" onClick={copyRoomId}>
              Copy Room ID
            </button>
            <button className="btn btn-danger w-100" onClick={leaveRoom}>
              Leave Room
            </button>
          </div>
        </div>

        {/* Editor panel */}
        
        <div className="col-md-10 text-light d-flex flex-column">
          <Editor
            socketRef={socketRef}
            roomId={roomId}
            onCodeChange={(code) => {
              codeRef.current = code;
            }}
          />
          </div>
        </div>
      </div>

     
  );
}

export default EditorPage;
