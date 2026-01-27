import { useState } from 'react';
import FileList from './components/FileList';
import { fileServerJoin, AppName } from './setup';
import './App.css'

function App() {
  const [cache, setCache] = useState(0);
  const uploadFile = (e : React.ChangeEvent) => {
    const fileInput : HTMLInputElement = e.target;
    if(!fileInput.files) return;
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    fetch(fileServerJoin('save'), {
      method: 'POST',
      body: formData
    }).then((res) => res.json())
    .then((r) => console.log(r))
    .then(() => setCache((v : number) => v + 1))
  }

  return (
    <>
      <header className="appHeader">
        <h1 className="appTitle">{AppName}</h1>
        <label className="uploadFileLabel" htmlFor="uploadFile">
          Enviar Arquivo
          <input id='uploadFile' type="file" onChange={uploadFile}/>
        </label>
      </header>
      <section className="FileListSection">
        <FileList cacheVersion={cache} />
      </section>
    </>
  )
}

export default App
