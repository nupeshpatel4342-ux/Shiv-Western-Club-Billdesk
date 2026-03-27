import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { C } from "./constants";

const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');

    *{box-sizing:border-box;margin:0;padding:0;font-family:'DM Sans',sans-serif;}
    body{background:${C.bg};}
    .pf{font-family:'Playfair Display',serif;}
    input,textarea{outline:none;border:none;background:transparent;width:100%;font-family:'DM Sans',sans-serif;color:inherit;}
    ::placeholder{color:${C.muted};opacity:0.7;}
    button{cursor:pointer;border:none;background:none;font-family:'DM Sans',sans-serif;}
    ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#ccc;border-radius:4px;}
    
    @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
    @keyframes slideInLeft{from{transform:translateX(-100%)}to{transform:translateX(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}

    .fade{animation:fadeIn 0.4s ease-out forwards;}
    .sup{animation:slideUp 0.35s cubic-bezier(0.16,1,0.3,1) forwards;}
    .sinl{animation:slideInLeft 0.3s ease-out forwards;}
    .sli:active{transform:scale(0.98);opacity:0.9;}
    .spin-on-click:active span{animation:spin 0.6s linear infinite;}
  `}</style>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Styles />
    <App />
  </StrictMode>,
);
