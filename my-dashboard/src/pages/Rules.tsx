import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useLocation } from 'react-router-dom';
import './Rules.css';

type GameRule = {
	id: string;
	titel: string;
	type: string;
	korteBeschrijving: string; // korte teaser onder de titel
	details?: string[]; // meerdere paragrafen voor extra uitleg
	regels: string[]; // beknopte regels (bullet points)
	tips?: string[]; // optionele tips
	enabled?: boolean; // of zichtbaar (backend)
};

// Static fallback definitions (used if backend has none)
export const GAMES_FALLBACK: GameRule[] = [
	{
		id: '8ball',
		titel: '8-Ball Pool',
		type: 'Pool',
		korteBeschrijving: 'Klassieke variant met hele (solids) en halve (stripes) ballen. Win door de 8-ball legaal te potten nadat je eigen groep weg is.',
		details: [
			'Setup: 15 gekleurde ballen worden in een driehoek gerackt met de 8-ball centraal. De witte (cue ball) ligt achter de lijn ("head string") bij de break. Je breekt: minstens 4 objectballen moeten een band raken of er moet een bal vallen voor een geldig break.',
			'Groepenbepaling: na de break ligt het nog open. Pas wanneer een speler een bal bewust (aangekondigd, indien huisregel) van één groep correct pot, krijgt hij die volledige groep (hele of halve). Vanaf dat moment MOET je altijd eerst een bal uit je eigen groep aanraken voordat iets anders legaal kan zijn.',
			'Doel & volgorde: pot al jouw groepballen, creëer daarbij een makkelijke “key ball” om goede positie op de 8-ball te krijgen. Je wint alleen als de 8-ball in een vooraf gekozen pocket wordt gemaakt zonder foul. Pot je de 8 te vroeg of samen met een fout (scratch) dan verlies je het frame.',
			'Beginnersfouten: te vroeg clusters openbreken (geeft kansen aan tegenstander), geen plan voor de laatste twee ballen, en te harde positionele stoten waardoor controle verloren gaat.'
		],
		regels: [
			'Witte bal achter de lijn bij de break.',
			'Een gemaakte bal bij de break bepaalt (meestal) nog niet je groep; keuze vast na eerste succesvolle "called" pot.',
			'Speel altijd eerst een bal uit je eigen groep (heel of half) nadat groepen zijn vastgesteld.',
			'Fout: witte bal potten, geen bal raken, verkeerde groep eerst raken, of 8-ball vroegtijdig potten.',
			'Win: pot de 8-ball legaal na al jouw groep-balllen weg zijn (en announce de pocket).',
		],
		tips: [
			'Kijk vooruit: plan 2–3 posities verder.',
			'Zorg voor een makkelijke laatste bal vóór de 8.',
		],
	},
	{
		id: '9ball',
		titel: '9-Ball',
		type: 'Pool',
		korteBeschrijving: 'Snel spel: altijd eerst de laagste nummerbal raken; de 9-Ball potten (legaal) beëindigt het frame.',
		details: [
			'9-Ball gebruikt de ballen 1 t/m 9. Je móét altijd eerst de laagste genummerde bal raken, maar je mag elke bal (inclusief de 9) potten via combinaties zolang de eerste aanraking correct is.',
			'Frames kunnen snel eindigen door een combinatie of carambole op de 9; daarom is defensief (safety) spel belangrijk. Een goede safety laat de tegenstander een moeilijk of zelfs onmogelijke stoot over.',
			'Push-out: direct na een geldig break mag de volgende speler éénmalig een "push-out" spelen: je verklaart dit vooraf, mag de cue ball vrij verplaatsen zonder potdoel, zolang je geen bal pot. De tegenstander kiest daarna of hij de volgende stoot neemt of hem teruggeeft.'
		],
		regels: [
			'Altijd eerst de laagste genummerde bal op tafel aanraken.',
			'Combinaties zijn toegestaan zolang de eerste geraakte bal de laagste is.',
			'Win direct als de 9-Ball legaal valt.',
			'Ball in hand na een fout: je mag overal plaatsen.',
		],
		tips: ['Gebruik safety shots als een potten riskant is.', 'Controle boven kracht bij de break.'],
	},
	{
		id: '10ball',
		titel: '10-Ball',
		type: 'Pool',
		korteBeschrijving: 'Technischer dan 9-Ball: elke pot aangekondigd, minder toeval.',
		details: [
			'10-Ball gebruikt de ballen 1 t/m 10 in een ruit-rack met de 1 vooraan en 10 centraal. De 10 mag alleen tellen als hij in een aangekondigde pocket valt via een legale shotvolgorde.',
			'Omdat “call shot” verplicht is, verdwijnt een groot deel van de geluksballen. Hierdoor draait het spel om pure controle: nauwkeurige potlijnen, snelheid en break management.',
			'Breakstrategie: je wilt de 1-Ball zichtbaar en speelbaar laten én een patroon creëren waarbij clusteropeningen gecontroleerd gebeuren.'
		],
		regels: [
			'Laagste nummer eerst raken; call pocket voor elke beoogde pot.',
			'Onverwacht gepotte niet-aangekondigde bal blijft meestal liggen (huisregel bevestigen).',
			'Win wanneer de 10 legaal en aangekondigd valt.',
			'Ball in hand bij fout (scratch, geen bal raken, verkeerde eerste bal).'
		],
		tips: ['Focus op positionele precisie boven harde breaks.', 'Gebruik push-out tactisch na de break.'],
	},
	{
		id: 'snooker',
		titel: 'Snooker',
		type: 'Snooker',
		korteBeschrijving: 'Technisch precisiespel met rode en gekleurde ballen voor puntentelling en lange “breaks”.',
		details: [
			'Het standaard snookerframe start met 15 rode ballen (1 punt) en 6 kleuren (2–7 punten). Na elke rode probeer je een kleur te potten; kleuren worden teruggelegd tot alle reds weg zijn.',
			'Na de laatste rode volgt de kleurensequentie: geel (2), groen (3), bruin (4), blauw (5), roze (6) en zwart (7). Kleuren worden nu NIET meer teruggelegd. De hoogste break (aantal opeenvolgende punten) is vaak een statussymbool.',
			'Beginnersfocus: leer “stun” (stuiter), “follow” (voorwaarts effect) en “screw” (terugtrekken) om de cue ball op gecontroleerde plekken te parkeren. Safety shots dwingen fouten af zodat jij een makkelijke rode kunt starten.'
		],
		regels: [
			'Score door afwisselend: rood (1 pt) – kleur (waarde) – rood – kleur…',
			'Na laatste rode: kleuren in volgorde geel (2), groen (3), bruin (4), blauw (5), roze (6), zwart (7).',
			'Fout: verkeerde volgorde, mis, of witte bal potten.',
			'Ball in hand bestaat niet; tegenstander krijgt punten (strafscores).',
		],
		tips: ['Speel positie voor volgende kleur.', 'Safety spel is cruciaal.'],
	},
	{
		id: 'killer',
		titel: 'Killer',
		type: 'Gezelschap',
		korteBeschrijving: 'Casual spel: iedereen heeft levens; mis je of maak je een fout dan verlies je er één. Laatste over wint.',
		details: [
			'Casual party-variant: snel, interactief en geschikt voor grote groepen. Levens kunnen worden aangepast (2–5) afhankelijk van tijd of spelersaantal.',
			'Wanneer een speler bijna geen levens meer heeft, verschuift de tactiek naar superveilige potkansen of defensieve stoten (ballen wegleggen).',
			'Huisregels variëren: soms telt een scratch voor 2 levens verlies, of mag je bij het potten van de 8 een leven terugverdienen. Maak dit vooraf duidelijk.'
		],
		regels: [
			'Start: iedereen 3 levens (of afgesproken aantal).',
			'Je moet een bal potten per beurt; anders verlies je een leven.',
			'Fout (scratch / geen bal raken) kost 1 extra leven (optioneel).',
			'Laatste speler met levens over wint.',
		],
		tips: ['Veilig spelen als je weinig levens hebt.', 'Gebruik zachte controle in plaats van brute kracht.'],
	},
	{
		id: 'onepocket',
		titel: 'One Pocket',
		type: 'Pool',
		korteBeschrijving: 'Elke speler krijgt één hoekpocket; alleen ballen in jouw eigen pocket scoren.',
		details: [
			'Positioneel en defensief: je verlegt ballen richting jouw pocket terwijl je de toegang naar die van je tegenstander blokkeert.',
			'Veel beslissingen zijn half-defensief: je legt ballen zo dat jij meerdere opties houdt maar de tegenstander niets direct kan scoren.',
			'Speed control is cruciaal: te hard schieten kan je bal naar de verkeerde tafelhelft laten terugkaatsen.'
		],
		regels: [
			'Speler A kiest (of lot) een hoekpocket; speler B krijgt de diagonale.',
			'Alleen ballen in jouw pocket tellen als punten.',
			'Eerste tot 8 (of 6) punten wint.',
			'Fout: witte bal potten, geen rail na contact, verkeerde pocket pot (bal terug op tafel).',
		],
		tips: ['Blokkeer de lijn naar de pocket van je tegenstander.', 'Geduld loont.'],
	},
	{
		id: 'bankpool',
		titel: 'Bank Pool',
		type: 'Pool',
		korteBeschrijving: 'Alleen potten via minimaal één (vaak precies één) band tellen als score.',
		details: [
			'Elke geldige pot vereist dat de objectbal vóór de pocket ten minste één band raakt (meestal zonder de witte via carambole te gebruiken voor de telling; huisregels kunnen variëren).',
			'Veel partijen spelen tot een vast aantal punten; elke correcte bank = 1 punt. Sommige varianten vereisen exact één band, andere laten meerdere toe zolang het een duidelijke bank is.',
			'Patroonherkenning: door het diamant-systeem te leren kun je consistent hoeken voorspellen in plaats van “op gevoel” te gokken.'
		],
		regels: [
			'Alle shots moeten een gebankte (band) pot zijn.',
			'Called shot: announce bal + pocket.',
			'Aantal punten/ballen vooraf afspreken (bv. 5 of 8).',
		],
		tips: ['Leer hoekregels (diamant systeem).', 'Rustig tempo voor precisie.'],
	},
	{
		id: 'straight',
		titel: 'Straight Pool (14.1)',
		type: 'Pool',
		korteBeschrijving: 'Continu score-spel: elke correcte (geroepen) pot = 1 punt; bij 14 gemaakte ballen wordt er her-rackt.',
		details: [
			'Een continu doorlopend spel gericht op lange series. Bij 14 gemaakte ballen blijft de 15e liggen; de overige 14 worden geracked en je probeert een “break ball” te gebruiken om opnieuw te openen.',
			'Planning: kies vroeg één of twee potentiële “break balls” (ballen die later een goede hoek geven om het nieuwe rack open te breken). Werk clusters subtiel los terwijl je positie behoudt.',
			'Veelvoorkomende fout: te snel alle open ballen potten en geen ideale break ball overhouden—dan stokt je volgende serie.'
		],
		regels: [
			'Elke correcte (geroepen) pot = 1 punt.',
			'Bij 14 gemaakte ballen: 14 weg, 1 blijft liggen; rack opnieuw en break verder.',
			'Doel: afgesproken score (bv. 75, 100).',
		],
		tips: ['Bewaar een open bal voor de herbreak.', 'Focus op cluster openbreken.'],
	},
	{
		id: 'carambole',
		titel: 'Carambole (Libre)',
		type: 'Carambole',
		korteBeschrijving: 'Geen pockets: raak in één stoot beide andere ballen (carambole) voor 1 punt en speel door.',
		details: [
			'Speel je met drie ballen: jouw speelbal (wit of geel) + twee objectballen. Doel is een carambole: beide objectballen in één stoot raken. Bij Libre zijn er geen strikte restricties op kleine gebieden van de tafel.',
			'Controle: zachte stoten met effect laten de speelbal “aanhaken” en weerkaatsen onder gunstige hoeken voor de volgende positie.',
			'Serieopbouw: houd de drie ballen dicht bijeen zonder ze te krap te clusteren; dat minimaliseert risico op misser.'
		],
		regels: [
			'Je speelt altijd met dezelfde speelbal.',
			'Raak beide objectballen in één beurt = punt + nog een beurt.',
			'Doel: afgesproken aantal caramboles.',
		],
		tips: ['Werk met stootlijnen en effect.', 'Korte serie opbouw is sleutel.'],
	},
	{
		id: 'drieband',
		titel: 'Driebanden',
		type: 'Carambole',
		korteBeschrijving: 'Je speelbal moet, na de eerste objectbal, minimaal drie banden raken vóór de tweede bal.',
		details: [
			'Driebanden vraagt diepe kennis van afstoothoeken en snelheid. Je speelbal moet eerst de eerste objectbal raken en vervolgens, vóór de tweede objectbal, minimaal drie banden aanraken.',
			'Serievorming is moeilijker; positioneel spel draait om gecontroleerde energie en voorbedachte trajecten. Je voorspelt vaak 5–6 contactmomenten vooruit.',
			'Effectgebruik: “reverse” (tegen- of terug-effect) verandert de herkaatslijn drastisch; experimenteren op trainingsafstanden versnelt begrip.'
		],
		regels: [
			'Eerst een objectbal raken, daarna totaal minstens drie banden voordat de tweede objectbal wordt geraakt.',
			'Geldige carambole = 1 punt en je blijft aan tafel.',
			'Gemiste carambole: beurt over.',
		],
		tips: ['Bestudeer diamantsystemen.', 'Effect (side spin) spaarzaam en doelgericht inzetten.'],
	},
	{
		id: 'artistiek',
		titel: 'Artistiek Biljart',
		type: 'Carambole',
		korteBeschrijving: 'Voorgeschreven figuren (“coups”) met vaste opstellingen en oplopende moeilijkheid en puntwaardes.',
		details: [
			'Elke figuur ("coup") heeft een specifieke balpositie en vereist een vooraf omschreven traject of effect. Spelers krijgen meestal meerdere pogingen per figuur.',
			'Spectaculair en technisch: draait om nauwkeurig effect, stoothoogte en snelheid. Veel figuren vereisen extreme masse (opzettelijk kromme baan), piqué (steile hoek naar beneden) of “piqué-lift”.',
			'Trainingstip: verdeel figuren per effectcategorie (massa, jump, retro, serie) en oefen batches; dat versnelt spierherinnering.'
		],
		regels: [
			'Volg de exacte opstelling van de figuur.',
			'Aantal pogingen (meestal 2 of 3) per figuur; punten hangen af van moeilijkheid.',
			'Totaal punten over alle figuren bepaalt de winnaar.',
		],
		tips: ['Herhaal basisfiguren voor spiergeheugen.', 'Let op constante stootroutine.'],
	},
];

const BACKEND_API_URL = (import.meta.env.VITE_BACKEND_URL || 'https://spc-8hcz.onrender.com').replace(/\/$/, '');

const Rules: React.FC = () => {
	const [open, setOpen] = useState<string | null>(null);
	const location = useLocation();
	const [stacked, setStacked] = useState(true); // true = één kolom => inline
	const gridRef = useRef<HTMLDivElement | null>(null);
	const [games, setGames] = useState<GameRule[]>(GAMES_FALLBACK);
	const [loaded, setLoaded] = useState(false);

	// Fetch dynamic rules
	useEffect(()=>{ (async()=>{
		try {
			const res = await fetch(`${BACKEND_API_URL}/api/rules`);
			if (res.ok) {
				const data = await res.json();
				if (Array.isArray(data) && data.length) {
					// map backend shape to GameRule
					const mapped = data.map((r:any): GameRule => ({
						id: r.id,
						titel: r.title || r.titel || 'Onbenoemd',
						type: r.type || 'Pool',
						korteBeschrijving: r.shortDescription || r.korteBeschrijving || '',
						details: r.details || [],
						regels: r.rules || [],
						tips: r.tips || [],
						enabled: r.enabled !== false,
					}));
					setGames(mapped.filter(g=>g.enabled));
				}
			}
		} finally { setLoaded(true); }
	})(); },[]);

	// Detecteer of de grid meer dan 1 kolom toont door positie van eerste 2 kaarten te vergelijken.
	useEffect(() => {
		const update = () => {
			const el = gridRef.current;
			if (!el) return;
			const cards = el.querySelectorAll<HTMLElement>('.rule-card');
			if (cards.length < 2) { setStacked(true); return; }
			// Verzamel offsetTop van eerste paar kaarten om kolomdetectie robuuster te maken
			const tops = Array.from(cards).slice(0, 6).map(c => c.offsetTop);
			const firstTop = tops[0];
			// Als er ten minste twee kaarten met dezelfde top zijn => er staat een tweede kaart naast de eerste => multi-col.
			const sameTopCount = tops.filter(t => t === firstTop).length;
			const multiColumn = sameTopCount > 1; // meer dan één kaart op rij 0
			setStacked(!multiColumn);
		};
		update();
		const ro = new ResizeObserver(update);
		if (gridRef.current) ro.observe(gridRef.current);
		window.addEventListener('resize', update);
		return () => { ro.disconnect(); window.removeEventListener('resize', update); };
	}, []);

	// Her-evalueer layout zodra een kaart opent/sluit (hoogtes kunnen veranderen)
	useEffect(() => {
		// microtask zodat DOM update klaar is
		const id = window.requestAnimationFrame(() => {
			const el = gridRef.current;
			if (!el) return;
			const cards = el.querySelectorAll<HTMLElement>('.rule-card');
			if (cards.length < 2) { setStacked(true); return; }
			const firstTop = cards[0].offsetTop;
			const secondTop = cards[1].offsetTop;
			setStacked(!(secondTop === firstTop));
		});
		return () => window.cancelAnimationFrame(id);
	}, [open]);

	// Sluit met Escape
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(null);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, []);

	// Deep link openen bij laden (hash #id)
	useEffect(() => {
		if (location.hash) {
			const id = location.hash.replace('#', '').toLowerCase();
			const match = sourceGames.find(g => g.id === id);
			if (match) setOpen(match.id);
		}
	}, [location.hash]);

	// Hash updaten bij open/close
	useEffect(() => {
		if (open) {
			const target = `#${open}`;
			if (window.location.hash !== target) {
				window.history.replaceState(null, '', window.location.pathname + target);
			}
		} else {
			if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
		}
	}, [open]);

	// Scroll naar kaart wanneer inline open
	useEffect(() => {
		if (stacked && open) {
			const el = document.getElementById(`card-${open}`);
			if (el) {
				el.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		}
	}, [open, stacked]);

	// Scroll lock bij desktop modal
	useEffect(() => {
		const useModal = !stacked && open;
		if (useModal) {
			const prev = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			return () => { document.body.style.overflow = prev; };
		}
	}, [open, stacked]);

		const sourceGames = games;
		const openGame = sourceGames.find(g => g.id === open) || null;
	const toggle = (id: string) => setOpen(o => o === id ? null : id);

	const modal = (!stacked && openGame) ? ReactDOM.createPortal(
		<div className="rules-modal-overlay" role="dialog" aria-modal="true" aria-labelledby={`modal-title-${openGame.id}`} onClick={() => setOpen(null)}>
			<div className="rules-modal" onClick={e => e.stopPropagation()}>
				<div className="rules-modal-header">
					<span className="rules-modal-type">{openGame.type}</span>
					<h2 id={`modal-title-${openGame.id}`}>{openGame.titel}</h2>
					<p className="rules-modal-intro">{openGame.korteBeschrijving}</p>
					{openGame.details && openGame.details.map((p, i) => (
						<p key={i} className="rules-modal-intro detail-paragraph">{p}</p>
					))}
				</div>
				<div className="rules-modal-content">
					<h3>Spelregels</h3>
					<ul className="rules-list">
						{openGame.regels.map((r, i) => (<li key={i}>{r}</li>))}
					</ul>
					{openGame.tips && openGame.tips.length > 0 && (
						<>
							<h3>Tips</h3>
							<ul className="rules-list">
								{openGame.tips.map((t, i) => (<li key={i}>{t}</li>))}
							</ul>
						</>
					)}
				</div>
				<div className="rules-modal-footer">
					<button className="rule-btn" onClick={() => setOpen(null)}>Sluiten</button>
				</div>
			</div>
		</div>,
		document.body
	) : null;

	return (
		<div className="rules-page">
			<section className="rules-hero">
				<h1>Spelregels & Spelvormen</h1>
				<p>Nieuw in de wereld van pool, snooker of carambole? Hieronder vind je toegankelijke uitleg per spel: wat het doel is, hoe je een frame of partij opzet, welke fouten (fouls) je moet vermijden en praktische tips om sneller beter te worden. Klik op <strong>Regels & Tips</strong> voor een uitgebreide, eenvoudige uitleg.</p>
			</section>
			<div className="rules-grid" ref={gridRef}>
			{sourceGames.map(g => {
					const expanded = open === g.id;
					const showInline = stacked && expanded; // alleen inline als gestapeld
					return (
						<article key={g.id} id={`card-${g.id}`} className={`rule-card${expanded ? ' active' : ''}`} tabIndex={0}>
							<div className="rule-meta">{g.type}</div>
							<h3>{g.titel}</h3>
							<p className="rule-desc">{g.korteBeschrijving}</p>
							<div className="rule-actions">
								<button className="rule-btn" onClick={() => toggle(g.id)} aria-expanded={expanded} aria-controls={!stacked ? undefined : `details-${g.id}`}>
									{expanded ? 'Sluiten' : 'Regels & Tips'}
								</button>
							</div>
							{showInline && (
								<div id={`details-${g.id}`} className="rule-expanded">
									{g.details && g.details.map((p, i) => (<p key={i} style={{ margin: '0 0 .8rem' }}>{p}</p>))}
									<h4>Spelregels</h4>
									<ul>
										{g.regels.map((r, i) => (<li key={i}>{r}</li>))}
									</ul>
									{g.tips && g.tips.length > 0 && (
										<>
											<h4>Tips</h4>
											<ul>
												{g.tips.map((t, i) => (<li key={i}>{t}</li>))}
											</ul>
										</>
									)}
								</div>
							)}
						</article>
					);
				})}
			</div>
			{modal}
		</div>
	);
};

export default Rules;
