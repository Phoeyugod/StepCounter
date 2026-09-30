
async function getUserSteps() {
    let uid = loadUser() ? loadUser().ID : 0;

    if (!uid) {
        showMessage('danger', 'ERROR', 'You must be logged in!');
        return;
    }

    const response = await fetch(`http://localhost:3000/steps/${uid}`);

    if (response.status !== 200) {
        const res = await response.json();
        showMessage('danger', 'ERROR', res.error);
        return;
    }

    const steps = await response.json();
    drawStepsTable(steps);
}

function drawStepsTable(steps) {
    const stepsList = document.querySelector('#stepsList');

    if (!stepsList) {
        console.error('Cannot find #stepsList');
        return;
    }

    stepsList.innerHTML = '';

    let totalSteps = 0;

    if (steps.length === 0) {
        stepsList.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">
                    No steps recorded yet.
                </td>
            </tr>`;
        return;
    }

    steps.forEach((step, index) => {
        totalSteps += Number(step.step_count);

        const tr = document.createElement('tr');

        const td1 = document.createElement('td');
        const td2 = document.createElement('td');
        const td3 = document.createElement('td');
        const td4 = document.createElement('td');

        td1.textContent = (index + 1) + '.';

        // Format date as YYYY.MM.DD
        const date = new Date(step.date);
        td2.textContent = date.toLocaleDateString('hu-HU');

        td3.className = 'text-end';
        td3.textContent = Number(step.step_count).toLocaleString('hu-HU');

       td4.className = 'text-end';

td4.innerHTML = `
    <button 
        type="button" 
        class="btn btn-danger"
        onclick="deleteStep(${step.id})">
        <i class="bi bi-trash"></i>
    </button>
`;

        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);
        tr.appendChild(td4);

        stepsList.appendChild(tr);
    });

    // Summary row
    const summary = document.createElement('tr');
    summary.className = 'table-secondary';

    summary.innerHTML = `
    <td></td>
    <td class="fw-bold">Summary</td>
    <td class="text-end fw-bold">
        ${totalSteps.toLocaleString('hu-HU')}
    </td>
    <td></td>
    `;

    summary.classList.add('summary-row');

    stepsList.appendChild(summary);
}
async function deleteStep(stepID) {

    let luid = loadUser() ? loadUser().ID : 0;

    if (!luid) {
        showMessage('danger', 'ERROR', 'You must be logged in!');
        return;
    }

    const response = await fetch(
        `http://localhost:3000/steps/${stepID}`,
        {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                luid: luid
            })
        }
    );

    const res = await response.json();

    if (response.status !== 200) {
        showMessage('danger', 'ERROR', res.error);
        return;
    }

    showMessage('success', 'SUCCESS', res.message);
    getUserSteps();     
}