export async function restoreCrmConnection(api,pairingToken){
 let pairingError;
 if(pairingToken){try{await api.pairDevice(pairingToken);}catch(error){pairingError=error;}}
 if(api.getCrmToken()){
  try{await api.crmRequest('session');}
  catch(error){if(error.status!==401)throw error;api.clearCrmSession();}
  if(api.getCrmToken()){await api.refreshSharedInvoices();return true;}
 }
 const proof=await api.deviceLoginProof();
 if(!proof){if(pairingError)throw pairingError;return false;}
 await api.signInCrm(proof);await api.refreshSharedInvoices();return true;
}
