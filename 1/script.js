import { employees, filterOptions } from "./data.js";

const yearFilter = document.querySelector("#yearFilter");
const quarterFilter = document.querySelector("#quarterFilter");
const categoryFilter = document.querySelector("#categoryFilter");
const searchInput = document.querySelector("#searchInput");
const podiumElement = document.querySelector("#podium");
const rankingListElement = document.querySelector("#rankingList");
const emptyStateElement = document.querySelector("#emptyState");

const appState = {
  selectedYear: filterOptions.years[0],
  selectedQuarter: filterOptions.quarters[0],
  selectedCategory: filterOptions.categories[0],
  searchTerm: "",
  expandedEmployeeIds: new Set(),
};

const iconPaths = {
  Education: "M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zM8 7h7v2H8zm0 4h8v2H8zm0 4h5v2H8z",
  "Public Speaking": "M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm6 1h-1.26A5.94 5.94 0 0 1 12 15a5.94 5.94 0 0 1-4.74-2H6a4 4 0 0 0-4 4v2h20v-2a4 4 0 0 0-4-4z",
  "University Partnership": "M12 3 1 9l11 6 9-4.91V17h2V9zm0 13L5.5 12.56V17L12 21l6.5-4v-4.44z",
};

initialize();

function initialize() {
  populateSelect(yearFilter, filterOptions.years);
  populateSelect(quarterFilter, filterOptions.quarters);
  populateSelect(categoryFilter, filterOptions.categories);

  yearFilter.addEventListener("change", () => {
    appState.selectedYear = yearFilter.value;
    render();
  });

  quarterFilter.addEventListener("change", () => {
    appState.selectedQuarter = quarterFilter.value;
    render();
  });

  categoryFilter.addEventListener("change", () => {
    appState.selectedCategory = categoryFilter.value;
    render();
  });

  searchInput.addEventListener("input", () => {
    appState.searchTerm = searchInput.value.trim().toLowerCase();
    render();
  });

  render();
}

function populateSelect(selectElement, values) {
  selectElement.innerHTML = values
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    .join("");
}

function render() {
  const employeesForFilters = employees
    .map((employee) => buildEmployeeView(employee))
    .filter((employee) => employee.filteredActivities.length > 0)
    .sort((left, right) => right.totalPoints - left.totalPoints || left.name.localeCompare(right.name))
    .map((employee, index) => ({
      ...employee,
      rank: index + 1,
    }));

  const rankedEmployees = employeesForFilters.filter((employee) => {
      const haystack = `${employee.name} ${employee.title} ${employee.code}`.toLowerCase();
      return haystack.includes(appState.searchTerm);
    });

  const visibleIds = new Set(rankedEmployees.map((employee) => employee.id));
  appState.expandedEmployeeIds = new Set(
    [...appState.expandedEmployeeIds].filter((employeeId) => visibleIds.has(employeeId)),
  );

  renderPodium(rankedEmployees.slice(0, 3));
  renderRankingList(rankedEmployees);

  emptyStateElement.hidden = rankedEmployees.length > 0;
}

function buildEmployeeView(employee) {
  const filteredActivities = employee.activities.filter((activity) => {
    const yearMatches =
      appState.selectedYear === "All Years" ||
      new Date(activity.date).getUTCFullYear().toString() === appState.selectedYear;

    const quarterMatches =
      appState.selectedQuarter === "All Quarters" ||
      getQuarter(activity.date) === appState.selectedQuarter;

    const categoryMatches =
      appState.selectedCategory === "All Categories" || activity.category === appState.selectedCategory;

    return yearMatches && quarterMatches && categoryMatches;
  });

  const categoryCounts = Object.fromEntries(
    filterOptions.categories
      .slice(1)
      .map((category) => [category, filteredActivities.filter((activity) => activity.category === category).length])
      .filter(([, count]) => count > 0),
  );

  const totalPoints = filteredActivities.reduce((sum, activity) => sum + activity.points, 0);

  return {
    ...employee,
    filteredActivities: filteredActivities.sort((left, right) => new Date(right.date) - new Date(left.date)),
    categoryCounts,
    totalPoints,
  };
}

function renderPodium(topThree) {
  const orderModel =
    topThree.length === 3
      ? [
          { employee: topThree[1], slotRank: 2 },
          { employee: topThree[0], slotRank: 1 },
          { employee: topThree[2], slotRank: 3 },
        ]
      : topThree.map((employee, index) => ({ employee, slotRank: index + 1 }));

  const podiumOrder = orderModel
    .filter((entry) => Boolean(entry.employee))
    .map(({ employee, slotRank }) => {
      const visualRank = slotRank;
      const actualRank = employee.rank;
      return `
        <article class="podium-card rank-${visualRank}">
          <div class="podium-person">
            <div class="avatar-wrap">
              <div class="avatar-ring">
                <div class="avatar" style="--avatar-color: ${employee.avatarColor}">${getInitials(employee.name)}</div>
              </div>
              <div class="podium-rank-badge">${actualRank}</div>
            </div>
            <h3 class="podium-name">${escapeHtml(employee.name)}</h3>
            <p class="podium-title">${escapeHtml(employee.title)}</p>
            <p class="podium-code">(${escapeHtml(employee.code)})</p>
            <div class="score-pill"><span class="star-icon"></span>${employee.totalPoints}</div>
          </div>
          <div class="podium-column podium-column-${visualRank}" aria-hidden="true">
            <span class="podium-column-number podium-column-number-${visualRank}">${actualRank}</span>
          </div>
        </article>
      `;
    })
    .filter(Boolean)
    .join("");

  podiumElement.className = `podium podium-count-${topThree.length}`;
  podiumElement.innerHTML = podiumOrder;
}

function renderRankingList(rankedEmployees) {
  rankingListElement.innerHTML = rankedEmployees
    .map((employee) => {
      const isExpanded = appState.expandedEmployeeIds.has(employee.id);
      const statBadges = Object.entries(employee.categoryCounts)
        .map(
          ([category, count]) => `
            <span class="stat-chip" data-tooltip="${escapeHtml(category)}" aria-label="${escapeHtml(category)}: ${count}">
              ${renderIcon(category)}
              ${count}
            </span>
          `,
        )
        .join("");

      return `
        <article class="ranking-item" data-expanded="${isExpanded}">
          <button class="ranking-summary" type="button" data-employee-id="${employee.id}" aria-expanded="${isExpanded}">
            <div class="ranking-person">
              <div class="rank-number">${employee.rank}</div>
              <div class="mini-avatar" style="--avatar-color: ${employee.avatarColor}">${getInitials(employee.name)}</div>
              <div class="person-copy">
                <h3>${escapeHtml(employee.name)}</h3>
                <p>${escapeHtml(employee.title)} (${escapeHtml(employee.code)})</p>
              </div>
            </div>
            <div class="ranking-meta">
              <div class="ranking-stats">${statBadges}</div>
              <div class="total-block">
                <span class="total-label">TOTAL</span>
                <span class="total-score"><span class="star-icon total-star"></span>${employee.totalPoints}</span>
              </div>
              <span class="expand-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M6.7 9.3 12 14.6l5.3-5.3 1.4 1.4-6.7 6.7-6.7-6.7z"/></svg>
              </span>
            </div>
          </button>
          ${isExpanded ? renderDetails(employee) : ""}
        </article>
      `;
    })
    .join("");

  rankingListElement.querySelectorAll(".ranking-summary").forEach((button) => {
    button.addEventListener("click", () => {
      const employeeId = button.dataset.employeeId;
      if (appState.expandedEmployeeIds.has(employeeId)) {
        appState.expandedEmployeeIds.delete(employeeId);
      } else {
        appState.expandedEmployeeIds.add(employeeId);
      }
      render();
    });
  });
}

function renderDetails(employee) {
  const rows = employee.filteredActivities
    .map(
      (activity) => `
        <tr>
          <td>${escapeHtml(activity.activity)}</td>
          <td><span class="category-badge">${escapeHtml(activity.category)}</span></td>
          <td>${formatDate(activity.date)}</td>
          <td class="points-positive">+${activity.points}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <div class="ranking-details">
      <div class="details-card">
        <h4>RECENT ACTIVITY</h4>
        <div class="activity-table-wrap">
          <table class="activity-table">
            <thead>
              <tr>
                <th>Activity</th>
                <th>Category</th>
                <th>Date</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function getQuarter(dateString) {
  const month = new Date(dateString).getUTCMonth() + 1;
  if (month <= 3) return "Q1";
  if (month <= 6) return "Q2";
  if (month <= 9) return "Q3";
  return "Q4";
}

function getInitials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function renderIcon(category) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${iconPaths[category]}"></path></svg>`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}