import fs from 'node:fs';
// These fixed local files are synthetic repository assets, encoded before API submission.
const attachments=[{filename:'northstar-invoice.pdf',contentType:'application/pdf',encoding:'base64',content:fs.readFileSync(new URL('../public/assets/northstar-invoice.pdf',import.meta.url)).toString('base64')},{filename:'email-inline.png',contentType:'image/png',cid:'northstar-logo',encoding:'base64',content:fs.readFileSync(new URL('../public/assets/email-inline.png',import.meta.url)).toString('base64')}];
const body={configuration:'APPROVED_PROFILE',from:'demo@example.invalid',to:'VERIFIED_ALLOWLIST_RECIPIENT',subject:'Synthetic invoice',body:'<p>Northstar DEMO-1042: $425.00, due November 15, 2026.</p><img src="cid:northstar-logo"/>',attachments,unsubscribeUrl:'https://example.invalid/preferences'};
// Inspect locally; this example deliberately does not execute fetch or send automatically.
console.log(JSON.stringify({...body,attachments:attachments.map(({content,...metadata})=>({...metadata,content:'[INLINE BYTES OMITTED]'}))},null,2));
// Explicitly call this function only after separately verifying account, SMTP profile and recipient.
export async function submitApprovedEmail({instance,token,configuration,from,recipient,confirmedRecipient}) {
  if (!recipient || recipient !== confirmedRecipient) throw Error('Confirm the verified recipient explicitly');
  const origin=new URL(process.env.EMAIL_API_URL||'http://localhost:10587');
  if (/matters/i.test(origin.hostname)||origin.port==='11303') throw Error('Matters API is outside the Email example boundary');
  const payload={...body,configuration,from,to:recipient};
  const response=await fetch(origin.origin+'/api/v1/send',{method:'POST',headers:{instance,'x-auth-token':token,'content-type':'application/json'},body:JSON.stringify(payload)});
  const result=await response.json();
  // Inspect actual HTTP/application status. No automatic retry and no final-delivery claim.
  return {status:response.status,result,finalInboxDeliveryVerified:false};
}
