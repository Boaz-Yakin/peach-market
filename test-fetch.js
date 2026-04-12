fetch("https://ygfdkcbctcwujjzkhetv.supabase.co/rest/v1/chat_rooms?select=*", {
  headers: {
    apikey: "sb_publishable_d2ouKeROI2xI_NlaEa_vvw_mYRnB8-3",
    Authorization: "Bearer sb_publishable_d2ouKeROI2xI_NlaEa_vvw_mYRnB8-3"
  }
}).then(res => res.json()).then(console.log);
