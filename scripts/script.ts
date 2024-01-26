import { Coords } from "./models/coords.model";
import { Room } from "./models/room.model";

// Logic variables
let floor: number[] = [9, 9];
let minmax: number[] = [14, 20];
let lastRooms = 4;
let roomLayout: Room[] = [];
const chance: number = 0.5;
let designatedRooms: number = 0;

// Visuals
let layout: HTMLElement;
let gridBg: HTMLDivElement;
let calculatedCells: HTMLSpanElement;
let minimumRooms: HTMLSpanElement;
let maximumRooms: HTMLSpanElement;

// On Document load setup the visuals
document.addEventListener("DOMContentLoaded", () => {
    layout = document.getElementById("layout")!;
    gridBg = document.createElement("div");
    gridBg.classList.add("grid-bg");
    layout.appendChild(gridBg);

    calculatedCells = document.getElementById("calculatedcells")!;
    minimumRooms = document.getElementById("minimumrooms")!;
    maximumRooms = document.getElementById("maximumrooms")!;

    const form = document.getElementById('form')! as HTMLFormElement;

    // Get Formdata and update variables
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        let formData = new FormData(e.target as HTMLFormElement);
        let formDataObject: { [key: string]: string } = {};
        formData.forEach((v, k) => formDataObject[k] = v as string);
        floor[0] = Number.parseInt(formDataObject['columns']);
        floor[1] = Number.parseInt(formDataObject['rows']);
        lastRooms = Number.parseInt(formDataObject['finalrooms']);
        
        minmax = [Math.ceil(floor[0] * floor[1] / 6), Math.floor(floor[0] * floor[1] / 4)];
        calculatedCells.innerText = (floor[0] * floor[1]).toString();
        minimumRooms.innerText = minmax[0].toString();
        maximumRooms.innerText = minmax[1].toString();
        
        initialize();
    })

    setLayoutGrid();
});

// Create visuals with set values
const setLayoutGrid = () => {
    layout.style.gridTemplateColumns = `repeat(${floor[0]}, 1fr)`;
    layout.style.gridTemplateRows = `repeat(${floor[1]}, 1fr)`;
    gridBg.style.gridTemplateColumns = `repeat(${floor[0]}, 1fr)`;
    gridBg.style.gridTemplateRows = `repeat(${floor[1]}, 1fr)`;
    gridBg.innerHTML = '';
    for(let i = 0; i < floor[0] * floor[1]; i++) gridBg.appendChild(document.createElement("div"));
}

const initialize = () => {
    // visual
    setLayoutGrid();
    layout.innerHTML = '';
    layout.appendChild(gridBg);


    designatedRooms = randomIntFromInterval(minmax[0], minmax[1]) - lastRooms;
    
    roomLayout = [];
    let start = createStartingPoint();
    generateBranches(start);
    
    while(roomLayout.length < designatedRooms) {
        generateBranches(roomLayout[Math.floor(Math.random() * roomLayout.length)])
    }
    setLastRooms();
    placeRooms();
}

const generateBranches = (room: Room) => {
    getAllRoomNeighborCoords(room.coords)
        .filter((n) => isInLayoutGrid(n) && !isOccupied(n))
        .forEach(n => {
            createBranch(room, n)
        });
}

const createBranch = (parent: Room, coords: Coords) => {
    while(1) {
        if(roomLayout.length >= designatedRooms) return;
        if(Math.random() 
            > (chance + (1 - chance) / 2)
            * (1 / getAllRoomNeighborCoords(coords).filter(n => isOccupied(n)).length)
        ) return;

        let branchRoom: Room = 
        {
            coords: coords,
            isStart: false,
            isLast: false,
        };

        setRoomLayout(branchRoom);
        let nbs = getAllRoomNeighborCoords(coords).filter((n) => isInLayoutGrid(n) && !isOccupied(n));
        if(nbs.length === 0) return;
        coords = nbs[Math.floor(Math.random() * nbs.length)];        
    }
}

const createStartingPoint = () => {
    let startingRoom: Room = {
        coords: {
            x_pos: Math.ceil(floor[0] / 2),
            y_pos: Math.ceil(floor[1] / 2)
        },
        isStart: true,
        isLast: false
    };
    setRoomLayout(startingRoom);
    return roomLayout[0];
}

const getAllRoomNeighborCoords = (coords: Coords) => {
    let neighbors: Coords[] = [
        {x_pos: coords.x_pos - 1, y_pos: coords.y_pos},
        {x_pos: coords.x_pos, y_pos: coords.y_pos - 1},
        {x_pos: coords.x_pos + 1, y_pos: coords.y_pos},
        {x_pos: coords.x_pos, y_pos: coords.y_pos + 1}    
    ];
    return neighbors;
}

const findRoomByCoords = (coords: Coords) => {
    return roomLayout.find(room => room.coords.x_pos === coords.x_pos && room.coords.y_pos === coords.y_pos)
};

const isInLayoutGrid = (coords: Coords) => {    
    return coords.x_pos > 0 && coords.x_pos <= floor[0] && coords.y_pos > 0 && coords.y_pos <= floor[1];
};

const isOccupied = (coords: Coords) => {
    return findRoomByCoords(coords) ? true : false;
};

const setRoomLayout = (room: Room) => {
    roomLayout.push(room);
};

const setLastRooms = () => {
    let candidates: Coords[] = [];
    for(const room of roomLayout) {
        let nbs = getAllRoomNeighborCoords(room.coords).filter(n => isInLayoutGrid(n) && !isOccupied(n));
        
        if(nbs.length === 0) continue;
        for(const n of nbs) {
            let nns = getAllRoomNeighborCoords(n).filter(a => isInLayoutGrid(a) && isOccupied(a));
            
            if (nns.length === 1 && !isInCandidates(candidates, n) && !isCandidatesNeighbor(candidates, n) && getDistanceFromStart(n) > 2) {
                candidates.push(n);
            }
        }
    }
    lastRooms = candidates.length < lastRooms ? candidates.length : lastRooms;
    for(let i = 0; i < lastRooms; i++) {
        let index = Math.floor(Math.random() * candidates.length);

        setRoomLayout({
            coords: candidates[index],
            isStart: false,
            isLast: true
        });

        candidates.splice(index, 1);
    }
}

const isInCandidates = (candidates: Coords[], candidate: Coords) => {
    return candidates.find(c => c.x_pos === candidate.x_pos && c.y_pos === candidate.y_pos) ? true : false;
}

const isCandidatesNeighbor = (candidates: Coords[], candidate: Coords) => {
    for(const c of candidates) {
        if(isInCandidates(getAllRoomNeighborCoords(c), candidate)) return true;
    }
    return false;
}

const placeRooms = async () => {
    for(const room of roomLayout) {
        
        let roomCell: HTMLDivElement = document.createElement("div");
        roomCell.style.gridArea = `${room.coords.y_pos} / ${room.coords.x_pos}`;
        let className = room.isStart ? 'start' : room.isLast ? 'last' : 'default';
        roomCell.classList.add(className);
        roomCell.classList.add('cell');
        layout.appendChild(roomCell);
        await sleep(20);
    }
}

const getDistanceFromStart = (coords: Coords) => {
    return Math.abs(coords.x_pos - roomLayout[0].coords.x_pos) + Math.abs(coords.y_pos - roomLayout[0].coords.y_pos);
}


// Utils
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));


const randomIntFromInterval = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min)
}