import { useState, useEffect } from "react";
import { fileServerJoin } from "../setup";
import './FileList.css';

export type FileListing = {
  fileName: string,
  fileSize: number,
  createdAt: number
};

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const ImageExtensions = ['png', 'jpg', 'jpeg', 'gif'];

function FilePreview({fileName} : {fileName: string}) {
  const [active, setActive] = useState<boolean>(false);
  const classes = ["FileListPreview"]
  if(active) {
    classes.push("active")
  }
  if (ImageExtensions.includes((fileName.split('.').pop() ?? '').toLowerCase())) {
    return (<div onClick={() => setActive((v) => !v )} className={classes.join(' ')}><img src={fileServerJoin('files', fileName)} /></div>);
  }
  return (<></>);
}

export default function FileList({cacheVersion} : {cacheVersion : number}) {
  const [files, setFiles] = useState<FileListing[]>([]);
  const [error, setError] = useState<null | Error>(null);
  const [isPending, setIsPending] = useState<boolean>(true);

  const loadList = () => {
    fetch(fileServerJoin('files')).then((r) => r.json()).then(obj => {
      setFiles([...obj]);
    }).catch(setError).finally(setIsPending.bind(null, false));
  };

  useEffect(loadList, [cacheVersion]);

  const deleteFile = (fileName : string) => () => {
    if(!confirm("Tem Certeza?")) return;
    setIsPending(true);
    fetch(fileServerJoin('delete', fileName), {
      method: 'DELETE'
    }).then(() => {
      setIsPending(false);
      setFiles(files.filter((file) => file.fileName !== fileName));
    }).catch(setError);
  }

  if(error) return (<p>Error Loading Files: {error.message}</p>);
  if(isPending) return (<p>Loading...</p>);
  return (files ?? []).map(({fileName, fileSize}) => (
    <div className="FileList" key={fileName}>
      <FilePreview fileName={fileName}/>
      <h1>{fileName}</h1>
      <div className="FileListFooter">
        <p>{`${formatBytes(fileSize)}`}</p>
        <ul className="FileListActions">
          <li><a href={fileServerJoin('files',fileName)}>Abrir</a></li>
          <li><button>Renomear</button></li>
          <li><button onClick={deleteFile(fileName)} className="delete">x</button></li>
        </ul>
      </div>
    </div>
  ));
}
