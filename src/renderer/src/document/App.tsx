import { pdf, PDFViewer } from "@react-pdf/renderer";
import { Message } from "@renderer/lib/types";
import { useEffect, useState } from "react";
import save from "../assets/save.svg";
import Book from "./Book";

function App(): React.JSX.Element {
  const [metadata, setMetadata] = useState<{
    authors: string;
    title: string;
    acknowledgements: string;
  }>({ authors: "", title: "iMessage Book", acknowledgements: "" });
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    window.electron.ipcRenderer.on("pdf-data", (_, data, messages) => {
      setMetadata(data);
      setMessages(messages);
    });
  }, []);

  if (!metadata || messages.length === 0) {
    return <h1>Loading....</h1>;
  }

  async function savePDF(): Promise<void> {
    const blob = await pdf(
      <Book data={metadata} messages={messages} />,
    ).toBlob();
    const arrayBuffer = await blob.arrayBuffer();
    window.electron.ipcRenderer.invoke("save-pdf", new Uint8Array(arrayBuffer));
  }

  return (
    <>
      <div>
        <button id="save" onClick={savePDF}>
          <img src={save} width="32px" height="32px" alt="save" />
          Save
        </button>
      </div>
      <PDFViewer width={"100%"} height={"100%"} showToolbar={false}>
        <Book data={metadata} messages={messages} />
      </PDFViewer>
    </>
  );
}

export default App;
