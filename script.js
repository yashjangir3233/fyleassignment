let currentPage = 1;
let resultsPerPage = 10;
let selectedUser;
let selectedUserProfile;


// showing loader function
function showLoader() {
    const loader = document.getElementById('loader');
    if(loader){
        loader.style.display = 'block';
    }
}

// hide loader
function hideLoader() {
    const loader = document.getElementById('loader');
    if(loader){
        loader.style.display = 'none';
    }
}


// search Users function
function searchUsers() {
    showLoader();
    const query = document.getElementById('searchBar').value.trim();
    const searchResultsContainer = document.querySelector('.searchResults');
    const SEARCHURL = `https://api.github.com/search/users?q=${query}+type:user&page=${currentPage}&per_page=${resultsPerPage}`;

    searchResultsContainer.innerHTML ='';

    // api for fetching search results
    fetch(SEARCHURL)
        .then(res => {
            if(!res.ok){
                throw new Error(`Fetching ${res.status} failed`);
            }
            return res.json();
        })
        .then(data => {
            hideLoader();
            if(data.items && data.items.length > 0){
                data.items.forEach(user => {
                    const resultItem = document.createElement('div');
                    resultItem.classList.add('searchResultItem');
                    resultItem.innerHTML = `<img src = ${user.avatar_url} alt="User avatar"> <p>${user.login}</p>`;
                    searchResultsContainer.appendChild(resultItem);
                });
                const highestTotalPages = Math.ceil(data.total_count/resultsPerPage);
                var totalPages = Math.min(highestTotalPages,100);
                createPaginationControls(totalPages);
            }else{
                const noResultMessage = document.createElement('p');
                noResultMessage.textContent='no users found';
                searchResultsContainer.appendChild(noResultMessage);
            }
            console.log('data from search : ',data);
        })
        .catch(e =>{
            hideLoader();
            console.error('error while searching for users',e);
        })
}

// creating Pagination for search user results
var highlightUsersPage = currentPage;
function createPaginationControls(totalPages){
    const paginationContainer = document.querySelector('.pagination');
    paginationContainer.innerHTML='';
    for(let i = 1;i<=totalPages;i++){
        const pageLink = document.createElement('a');
        pageLink.href=`#${i}`;
        pageLink.textContent=i;
        pageLink.addEventListener('click',() => {
            currentPage = i;
            highlightUsersPage = currentPage;
            searchUsers();
        })
        paginationContainer.appendChild(pageLink);
    }

    const allUserPagination = document.querySelectorAll('.pagination a');
allUserPagination.forEach(link => {
    link.style.color = '#89919b';
    link.style.textDecoration = 'none';
    const nthUserPagination = document.querySelector('.pagination a:nth-child('+highlightUsersPage+')');

    
    if (nthUserPagination) {
        nthUserPagination.style.color = 'blue';
    } else {
        console.error('Nth link not found.');
    }
});
}

const perPageDropdown = document.getElementById("chooseNumberPerPage");
let reposPerPage = perPageDropdown.value;
let repoCurrentPage = 1;

perPageDropdown.addEventListener('change',function() {
    reposPerPage = perPageDropdown.value;
    repoCurrentPage = 1;
    fetchUserRepos(selectedUser);
})


// function for fetching user repositories
function fetchUserRepos(username) {
    showLoader();
    const repoResultsContainer = document.querySelector('.repoResults');
    const REPOAPIURL = `https://api.github.com/users/${username}/repos?page=${repoCurrentPage}&per_page=${reposPerPage}`;
    repoResultsContainer.innerHTML = '';
    // api call for fetching repositories
    fetch(REPOAPIURL)
        .then(res => {
            if(!res.ok){
                console.log(res);
                if(res.status === 403){
                    const errorElement = document.createElement('div');
                    errorElement.textContent = 'rate limit exceeded please try again after 10 to 20 minutes';
                    errorElement.style.color = 'red';
                    repoResultsContainer.appendChild(errorElement);
                }
                throw new Error(`fetching repo failed ${res.status}`);
            }
            const headerLink = res.headers.get('Link');
                const totalPages = headerLink && headerLink.match(/page=(\d+)&per_page=(\d+)>; rel="last"/);
                const repoTotalPages = totalPages ? parseInt(totalPages[1]) : 1;
            return res.json().then(data => ({data,repoTotalPages}));
        })
        .then(({data,repoTotalPages}) => {
            hideLoader();
            if(data && data.length>0){
                data.forEach(repo => {
                    const resultRepoItem = document.createElement('div');
                    resultRepoItem.classList.add('repoItem');
                    resultRepoItem.innerHTML = `<p>${repo.name}</p><p>${repo.description}</p>`;
                    repoResultsContainer.appendChild(resultRepoItem);
                    var LANGAPI = repo.languages_url;
                    showLoader();
                    // api call for fetching languages for repositories
                    fetch(LANGAPI)
                        .then(res => {
                            if(!res.ok){
                                throw new Error(`fetching languages failed${res.status}`);
                            }
                            return res.json();
                        })
                        .then(data => {
                            hideLoader();
                            const languagesResults = document.createElement('div');
                            // repoResultsContainer.appendChild(languagesResults);
                            const languages = Object.keys(data);
                            if(languages && languages.length > 0){
                                var remainingLang = 0;
                                if(languages.length > 3){
                                    remainingLang = languages.length-3;
                                    languages.splice(3);
                                }
                                languages.forEach(language => {
                                    const languageBox = document.createElement('span');
                                    languageBox.classList.add('languageBoxStyle');
                                    if(language != languages[2]){
                                        languageBox.textContent = language;
                                    }else if(remainingLang != 0 && language == languages[2]){
                                        languageBox.textContent = `${language} +${remainingLang}`;
                                    }else{
                                        languageBox.textContent = language;
                                    }
                                    languagesResults.appendChild(languageBox);
                                })
                                resultRepoItem.appendChild(languagesResults);
                            }else{
                                const noLangFound = document.createElement('p');
                                noLangFound.textContent = 'No language found';
                                resultRepoItem.appendChild(noLangFound);
                            }
                        })
                        .catch(e => {
                            console.error('error:',e);
                        })
                })
                
                createPaginationForRepos(repoTotalPages,username);
            }else{
                const noRepoResultMessage = document.createElement('p');
                noRepoResultMessage.textContent='no repos found';
                repoResultsContainer.appendChild(noRepoResultMessage);
            }
            console.log('repo data fetched',data);
        })
        .catch(e => {
            hideLoader();
            console.error('error while fetching repo data',e);
        })
}


// pagination for repos
var highlightPage = repoCurrentPage;
function createPaginationForRepos(repoTotalPages,username){
    const repoPaginationContainer = document.querySelector('.repoPagination');
    repoPaginationContainer.innerHTML = '';
    for(let i =1 ;i<=repoTotalPages ;i++){
        const repoPageLink = document.createElement('a');
        repoPageLink.href = `#${i}`;
        repoPageLink.textContent = i;
        repoPageLink.addEventListener('click',() => {
            repoCurrentPage = i; 
            highlightPage = i;           
            fetchUserRepos(username);
        })
        repoPaginationContainer.appendChild(repoPageLink);
    }
    const allPagination = document.querySelectorAll('.repoPagination a');
allPagination.forEach(link => {
    link.style.color = '#89919b';
    link.style.textDecoration = 'none';
    const nthPagination = document.querySelector('.repoPagination a:nth-child('+highlightPage+')');

    
    if (nthPagination) {
        nthPagination.style.color = 'blue';
    } else {
        console.error('Nth link not found.');
    }
});
}


//modal opening and closing
document.addEventListener("DOMContentLoaded", function () {
    document.querySelector('.searchResults').addEventListener('click',function(event){
        var clickedUser = event.target;
        if((clickedUser.tagName === 'P'||clickedUser.tagName === 'IMG') && clickedUser.parentElement.classList.contains('searchResultItem')){
            modal.style.display = 'block';
            // var username = clickedUser.textContent;
            const username = clickedUser.tagName === 'P' ? clickedUser.textContent : clickedUser.nextElementSibling.textContent;
            console.log(username);
            const profilePicForModal = clickedUser.tagName === 'P' ? clickedUser.previousElementSibling.src : clickedUser.src;
            selectedUserProfile = profilePicForModal;
            selectedUser = username;
            console.log(profilePicForModal);
            var modalContent = document.querySelector('.usernameClicked');
            var profileForUserClicked = document.querySelector('.userClickedProfile');
            profileForUserClicked.src = selectedUserProfile;
            modalContent.textContent = username;
            fetchUserRepos(username);
        }
    })
    var closeModalBtn = document.getElementById("closeModalBtn");
    var modal = document.getElementById("userModal");

    closeModalBtn.addEventListener("click", function () {
        modal.style.display = "none";
        repoCurrentPage=1;
    });

    window.addEventListener("click", function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
        repoCurrentPage=1;
    });
});


document.getElementById('searchUser').addEventListener('click',searchUsers);
