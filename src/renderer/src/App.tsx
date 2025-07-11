import folder from "./assets/folder.svg";
import computer from "./assets/computer.svg";
import write from "./assets/write.svg";
import { useEffect, useState } from "react";
import Select, { MultiValue } from "react-select";

type ContactOption = {
  value: string;
  label: string;
};

function App(): React.JSX.Element {
  const [exists, setExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [phoneNumbers, setPhoneNumbers] = useState<ContactOption[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<ContactOption[]>([]);
  const [title, setTitle] = useState<string>('');
  const [acknowledgements, setAcknowledgements] = useState<string>('');
  const [yourName, setYourName] = useState<string>('');
  const [theirName, setTheirName] = useState<string>('');

  async function findDefault(): Promise<boolean> {
    return await window.electron.ipcRenderer.invoke("find-default");
  }

  async function handleDefaultClick(): Promise<void> {
    setLoading(true);
    const result = await window.electron.ipcRenderer.invoke("get-contacts");
    setLoading(false);
    if (result.success) {
      const options = result.contacts.map((item: { id: string }) => ({
        value: item.id,
        label: item.id,
      }));
      setPhoneNumbers(options);
    } else {
      console.error("Error reading file:", result.error);
    }
  }

  async function handleCreateClick(): Promise<void> {
    if (selectedContacts.length === 0) {
      alert("Please select at least one contact.");
      return;
    }
    const contactIds = selectedContacts.map((contact) => contact.value);
    setLoading(true);
    const result = await window.electron.ipcRenderer.invoke(
      "get-messages",
      contactIds,
    );
    setLoading(false);
    if (!result.success) console.error("Error getting messages:", result.error);
    try {
      await window.electron.ipcRenderer.invoke(
        "generate-pdf",
        {
          authors: [yourName, theirName],
          title: title,
          acknowledgements: acknowledgements,
        },
        result.messages,
      );
    } catch (error) {
      console.error("Error invoking PDF generation:", error);
    }
  }

  useEffect(() => {
    const checkDefault = async (): Promise<void> => {
      const result = await findDefault();
      setExists(result);
    };
    checkDefault();
  }, []);

  return (
    <>
      {phoneNumbers.length === 0 ? (
        <span>1. Select a database to begin...</span>
      ) : (
        <></>
      )}
      <div id="button-container">
        <button
          className={"left"}
          onClick={handleDefaultClick}
          disabled={!exists}
        >
          <img src={computer} width="32px" height="32px" alt="computer" />
          Default Database
        </button>
        <button className="right" disabled>
          Choose Backup File
          <img src={folder} width="32px" height="32px" alt="folder" />
        </button>
      </div>
      {phoneNumbers.length === 0 ? (
        <></>
      ) : (
        <>
        <div id="choose-contacts">
          <span>2. Choose the contacts to include in your book...</span>
          <div id="create-container">
            <Select
              isMulti
              name="contacts"
              options={phoneNumbers}
              classNamePrefix={"select"}
              onChange={(selected: MultiValue<ContactOption>) =>
                setSelectedContacts(selected as ContactOption[])
              }
            />
          </div>
        </div>
        <div id="collect-meta">
          <span>3. Add in some details...</span>
          <input placeholder="Book title" onChange={e => setTitle(e.target.value)}/>
          <input placeholder="Acknowledgements" onChange={e => setAcknowledgements(e.target.value)}/>
          <input placeholder="Their name" onChange={e => setTheirName(e.target.value)}/>
          <input placeholder="Your name" onChange={e => setYourName(e.target.value)}/>
        </div>
        <button onClick={handleCreateClick}>
              Create
              <img src={write} width={"21px"} height={"21px"} alt="Pen" />
          </button>
        </>
      )}
      {loading ? <span>Loading...</span> : <></>}
    </>
  );
}

export default App;
