GOOGLE_SHEET_FETCH_FACTION_STATS = "https://mehbark-rdl-server.deno.dev/faction-stats";

GOOGLE_SHEET_FETCH_PLAYER_STATS = "https://script.google.com/macros/s/AKfycbyMS-qgpSnBpBVMKM8v8_UKf_qIrrvZ2CJRGXvKJQ1xq49SdbHf412_6Kzs8HIsNCMf/exec";
let factionStats = {};
window.addEventListener("load", () => {

  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  document.getElementById('playerNameLookUp').value = urlParams.get('playerName');
  refreshFactionStats();
});

function updateSeasonsList(data){
  let seasons =[];
  for(const key in data){
    if(key !== 'All Seasons'){
      seasons.push(key);
    }
  }
  seasons.reverse();
  let ul = document.getElementById('seasonsList');
  ul.innerHTML = '';
  ul.appendChild(createSeasonLi('All Seasons', data, true))
  for(let i = 0; i < seasons.length; i++){
    ul.appendChild(createSeasonLi(seasons[i], data));
  }
}

function createSeasonLi(season, data, isDefault){
  let li = document.createElement('li');
  li.id = season;
  if(isDefault){
    li.classList.add('selected');
  }
  li.innerText =data[season]['name'];
  li.addEventListener('click', selectSeason);
  return li;
}

function selectSeason(event){
  let selectedSeason = event.target;
  let unselect = document.querySelectorAll('li.selected');
  for(let i = 0; i < unselect.length; i++){
    unselect[i].classList.remove('selected');
  }
  selectedSeason.classList.add('selected');
  updateFactionsStats(factionStats[selectedSeason.id]);
  document.getElementById('playerNameLookUp').value = '';
}

function updateFactionsStats(factionStatData) {
  let leaderBoardTitle = document.getElementById('factionStatsTitle');
  leaderBoardTitle.innerText = factionStatData.name + " Faction Stats";
  let tbody = document.getElementById('factions');
  tbody.innerHTML = '';
  let otherTBody = document.getElementById('otherStats');
  otherTBody.innerHTML = '';
  let otherStatsHeader = document.getElementById('otherStatsHeader');
  otherStatsHeader.style.display = 'none';
  let factions = factionStatData.factions;
  document.querySelectorAll('th')[0].click(); //comes in sorted first click doesn't do anything
  for (let i = 0; i < factions.length; i++) {
    if(factions[i].faction === 'Dominance' || factions[i].faction=== 'Coalition'){
      //add it to other data
    }else {
      let tr = createFactionRow(factions[i]);
      tbody.appendChild(tr);
    }
  }
  document.querySelectorAll('th').forEach(th => th.classList.remove('sortDesc', 'sortAsc'));
  document.querySelectorAll('th')[0].classList.add('sortAsc');
}

function createFactionRow(faction){
  let tr = document.createElement('tr');
  for(const key in faction){
    let td = document.createElement('td');
    if(key === 'winRate'){
      td.innerText = formatWinRate(faction[key]*100);
      td.style.paddingRight = '0px';
      td.style.marginRight = '0px';
      td.style.textAlign = 'right';
      let percentLabel = document.createElement('td');
      percentLabel.innerHTML = '%';
      percentLabel.style.paddingLeft = '3px';
      percentLabel.style.textAlign= 'left';
      percentLabel.style.marginLeft = '0px';
      tr.appendChild(td);
      tr.appendChild(percentLabel);
    }else {
      if (key === 'order') {
        td.style.display = 'none';
      }
      td.innerText = faction[key];
      tr.appendChild(td);
    }
  }
  return tr;
}

function formatWinRate(winRate){
  return parseFloat(winRate).toFixed(2);// + "%";
}

function showLoading(){
  let dummyUl = document.getElementById('dummy-list');
  dummyUl.style.display = 'block';
  let dummyTbody = document.getElementById('dummy-tbody');
  dummyTbody.hidden = false;
  let tbody = document.getElementById('factions');
  tbody.hidden = true;
  let otherStats = document.getElementById('otherStats');
  otherStats.hidden = true;
  let ul = document.getElementById('seasonsList');
  ul.style.display = 'none';
}

function showLoaded(){
  let dummyUl = document.getElementById('dummy-list');
  dummyUl.style.display = 'none';
  let dummyTbody = document.getElementById('dummy-tbody');
  dummyTbody.hidden = true;
  let tbody = document.getElementById('factions');
  tbody.hidden = false;
  let otherStats = document.getElementById('otherStats');
  otherStats.hidden = false;
  let ul = document.getElementById('seasonsList');
  ul.style.display = 'block';
}
function showNoResultsToLoad(){
  let ul = document.getElementById('seasonsList');
  ul.innerHTML = 'No Results found!!!';
  let tbody = document.getElementById('factions');
  tbody.innerHTML = 'No Results found!!!';
  showLoaded();
}
function showFailedToLoad(e){
  console.log(e);
  if(confirm("Failed to retrieve faction stats!!  Try again?")){
    refreshFactionStats();
  }else{
    showNoResultsToLoad();
  }
}


function updatePlayerOtherStats(data){
  // add win rates by turn order,  and win by coalition/Dominance.
  let unselect = document.querySelectorAll('li.selected');
  for(let i = 0; i < unselect.length; i++){
    unselect[i].classList.remove('selected');
  }
  document.getElementById('staticList').getElementsByTagName('li')[0].classList.add('selected');
  let otherStatsHeader = document.getElementById('otherStatsHeader');
  otherStatsHeader.style.display = 'table-header-group';
  let otherStats = document.getElementById('otherStats');
  let turnOrderStats = data.turnOrderStats;
  let miscStats = data.miscStats;
  for(let i = 0; i < turnOrderStats.length; i++){
    otherStats.appendChild(createFactionRow(turnOrderStats[i]));
  }
  let factions = data.factions;
  for (let i = 0; i < factions.length; i++) {
    if(factions[i].faction === 'Dominance' || factions[i].faction=== 'Coalition'){
      otherStats.appendChild(createFactionRow(factions[i]));
    }
  }

  for(let i = 0; i < miscStats.length; i++){
    otherStats.appendChild(createFactionRow(miscStats[i]));
  }

}

function loadPlayerStats(){
  let playerName = document.getElementById('playerNameLookUp').value;
  showLoading();
  fetch(GOOGLE_SHEET_FETCH_PLAYER_STATS+"?name="+encodeURIComponent(playerName)).then((response)=> response.json()).then((data)=> {
    console.log(data);
    updateFactionsStats(data);
    updatePlayerOtherStats(data)
    showLoaded();
  }).catch(function(e){
    showFailedToLoad(e);
  });
}

function refreshFactionStats(){
  showLoading()
  let playerName = document.getElementById('playerNameLookUp');
  fetch(GOOGLE_SHEET_FETCH_FACTION_STATS).then((response)=> response.json()).then((data)=> {
    console.log(data);
    factionStats = data;
    updateSeasonsList(data);
    if(playerName.value){
      loadPlayerStats();
    }else{
      updateFactionsStats(data['All Seasons']);
      showLoaded();
    }

  }).catch (function(e){
    showFailedToLoad(e);
  });
}

const getCellValue = (tr, idx) => tr.children[idx].innerText || tr.children[idx].textContent;
const comparer = (idx, asc) => (a, b) => ((v1, v2) =>
    v1 !== '' && v2 !== '' && !isNaN(v1) && !isNaN(v2) ? v1 - v2 : v1.toString().localeCompare(v2)
)(getCellValue(asc ? a : b, idx), getCellValue(asc ? b : a, idx));
document.querySelectorAll('th').forEach(th => th.addEventListener('click', (() => {
  const tbody = document.getElementById('factions');
  document.querySelectorAll('th').forEach(th => th.classList.remove('sortDesc', 'sortAsc'));
  if(this.asc){
    th.classList.remove('sortAsc');
    th.classList.add('sortDesc');
  }else{
    th.classList.add('sortAsc');
    th.classList.remove('sortDesc');
  }
  Array.from(tbody.getElementsByTagName('tr'))
    .sort(comparer(Array.from(th.parentNode.children).indexOf(th), this.asc = !this.asc))
    .forEach(tr => tbody.appendChild(tr) );
})));
