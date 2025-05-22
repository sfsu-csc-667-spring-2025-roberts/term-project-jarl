document.addEventListener("DOMContentLoaded", () => {
  const callBtn = document.querySelector<HTMLButtonElement>("#btn-call");
  const raiseBtn = document.querySelector<HTMLButtonElement>("#btn-raise");

  const main = document.querySelector<HTMLDivElement>("main");
  const mainId = main!.id;
  const gameId = parseInt(mainId.split("-")[1]);

  callBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    callBtn?.classList.toggle("hidden");
    fetch(`/actions/${gameId}/call`, { method: "POST" }).then((response) => {
      if (response.ok) {
        console.log(`in client, there are ${response} data`);
      } else {
        console.error("Failed to call");
      }
    });
  });

  raiseBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    raiseBtn?.classList.toggle("hidden");
    fetch(`/actions/${gameId}/raise`, { method: "POST" }).then((response) => {
      if (response.ok) {
        console.log(`in client, there are ${response} data`);
      } else {
        console.error("Failed to raise");
      }
    });
  });
});
