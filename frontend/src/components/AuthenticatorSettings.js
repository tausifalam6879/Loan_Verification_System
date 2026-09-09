import React, {useState} from 'react';
import {Alert, Button, Card, CardContent, Stack, TextField, Typography} from '@mui/material';
import {authenticatorAction, authenticatorStatus} from '../services/authenticatorService';
import {requestOtp, verifyOtp} from '../services/authService';
import {demoMode} from '../api/demoAdapter';

export default function AuthenticatorSettings({email}) {
  const [opened,setOpened]=useState(false), [enabled,setEnabled]=useState(false);
  const [password,setPassword]=useState(''), [code,setCode]=useState(''), [setup,setSetup]=useState(null);
  const [busy,setBusy]=useState(false), [error,setError]=useState(''), [message,setMessage]=useState('');
  const [emailCode,setEmailCode]=useState(''), [recovery,setRecovery]=useState(false);
  const run=async action=>{setBusy(true);setError('');setMessage('');try{await action();}catch(e){setError(e.response?.data?.message||'Authenticator service unavailable. No change confirmed; reload the status before trying again.');}finally{setBusy(false);setPassword('');setCode('');}};
  const load=()=>run(async()=>{const state=await authenticatorStatus();setEnabled(state.enabled);setOpened(true);setSetup(null);});
  return <Card sx={{mb:3}}><CardContent><Stack spacing={2}>
    <Typography variant="h6">Authenticator app — no SMS charges</Typography>
    <Typography>Generate a 6-digit code on your phone. This does not verify your mobile number. Once enabled, password sign-in also requires the app code. Existing Email OTP remains an alternative sign-in and recovery method.</Typography>
    {demoMode ? <Alert severity="info">Authenticator setup requires a real server account, not a browser-demo account.</Alert> : <Button disabled={busy} onClick={load}>{opened?'Reload authenticator status':'Manage authenticator'}</Button>}
    {error&&<Alert severity="error">{error}</Alert>}{message&&<Alert severity="success">{message}</Alert>}
    {opened&&<>
      <Typography>Status: {enabled?'Enabled':'Not enabled'}</Typography>
      <TextField label="Current account password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/>
      {!enabled&&!setup&&<Button disabled={busy||!password} onClick={()=>run(async()=>{setSetup(await authenticatorAction('setup',{password}));})}>Create setup key</Button>}
      {setup&&<>
        <Alert severity="warning">Keep this setup key private. Do not send it in chat or screenshots. Setup expires in 10 minutes. Sign-in stays unchanged until you confirm a valid code.</Alert>
        <Typography>In your authenticator app, choose Add account → Enter setup key. Account: {setup.account}. Type: Time based. Then enter the app's code below.</Typography>
        <TextField label="Private setup key" value={setup.setupKey} slotProps={{input:{readOnly:true}}}/>
      </>}
      {(enabled||setup)&&<TextField label="Authenticator app code" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} autoComplete="one-time-code" slotProps={{htmlInput:{inputMode:'numeric',maxLength:6}}} helperText="Use a fresh code. Keep your phone date and time automatic." disabled={busy}/>}
      {setup&&<Button disabled={busy||code.length!==6} onClick={()=>run(async()=>{await authenticatorAction('confirm',{code});setSetup(null);setEnabled(true);setMessage('Authenticator enabled. Wait for the next code before your next login.');})}>Confirm and enable</Button>}
      {enabled&&<>
        <Button disabled={busy||!password||code.length!==6} onClick={()=>run(async()=>{await authenticatorAction('disable',{password,code});setEnabled(false);setRecovery(false);setMessage('Authenticator disabled. Password and Email OTP sign-in remain available.');})}>Disable using password and app code</Button>
        <Button disabled={busy} onClick={()=>run(async()=>{await requestOtp({email,channel:'EMAIL',purpose:'LOGIN'});setRecovery(true);setMessage('Recovery code sent to your account email.');})}>Lost your phone? Send email recovery code</Button>
        {recovery&&<><TextField label="Email recovery code" value={emailCode} onChange={e=>setEmailCode(e.target.value.replace(/\D/g,'').slice(0,6))} autoComplete="one-time-code"/>
          <Button disabled={busy||!password||emailCode.length!==6} onClick={()=>run(async()=>{const proof=await verifyOtp({email,channel:'EMAIL',purpose:'LOGIN',otp:emailCode});await authenticatorAction('disable',{password,emailOtpToken:proof.otpToken});setEnabled(false);setRecovery(false);setEmailCode('');setMessage('Authenticator removed using email recovery. You can set up your new phone.');})}>Disable using password and email recovery</Button></>}
      </>}
    </>}
  </Stack></CardContent></Card>;
}
