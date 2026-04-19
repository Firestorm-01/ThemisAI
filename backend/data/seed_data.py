"""
seed_data.py — Run once to pre-populate Qdrant with core Indian law text.
Usage: python seed_data.py
"""
import sys
import os
import uuid
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import get_settings
from app.services.qdrant_service import get_qdrant_client, ensure_collections, upsert_text_points
from app.services.embedder import embed_texts
from qdrant_client.models import PointStruct

settings = get_settings()

IPC_SEED = [
    {
        "title": "IPC §299 — Culpable Homicide",
        "text": "Section 299 IPC: Whoever causes death by doing an act with the intention of causing death, or with the intention of causing such bodily injury as is likely to cause death, or with the knowledge that he is likely by such act to cause death, commits the offence of culpable homicide. Illustrations: (a) A lays sticks and turf over a pit, with the intention of thereby causing death, or with the knowledge that death is likely to be thereby caused. Z believing the ground to be firm, treads on it, falls in and is killed. A has committed the offence of culpable homicide.",
        "source_type": "text", "file_name": "IPC_1860.txt", "page": 1,
    },
    {
        "title": "IPC §300 — Murder",
        "text": "Section 300 IPC: Culpable homicide is murder if the act by which the death is caused is done with the intention of causing death, or if it is done with the intention of causing such bodily injury as the offender knows to be likely to cause the death of the person to whom the harm is caused, or if it is done with the intention of causing bodily injury to any person and the bodily injury intended to be inflicted is sufficient in the ordinary course of nature to cause death, or if the person committing the act knows that it is so imminently dangerous that it must, in all probability, cause death. Exceptions: Culpable homicide is not murder if the offender, whilst deprived of the power of self-control by grave and sudden provocation, causes the death of the person who gave the provocation.",
        "source_type": "text", "file_name": "IPC_1860.txt", "page": 1,
    },
    {
        "title": "IPC §302 — Punishment for Murder",
        "text": "Section 302 IPC: Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine. This is a cognizable, non-bailable, non-compoundable offence triable by Court of Session. The Supreme Court in Bachan Singh v. State of Punjab (1980) held that death penalty should be awarded only in the rarest of rare cases.",
        "source_type": "text", "file_name": "IPC_1860.txt", "page": 2,
    },
    {
        "title": "IPC §304 — Culpable Homicide Not Amounting to Murder",
        "text": "Section 304 IPC: Whoever commits culpable homicide not amounting to murder shall be punished with imprisonment for life, or imprisonment of either description for a term which may extend to ten years, and shall also be liable to fine, if the act by which the death is caused is done with the intention of causing death, or of causing such bodily injury as is likely to cause death [Part I]; or with imprisonment of either description for a term which may extend to ten years, or with fine, or with both, if the act is done with the knowledge that it is likely to cause death, but without any intention to cause death, or to cause such bodily injury as is likely to cause death [Part II].",
        "source_type": "text", "file_name": "IPC_1860.txt", "page": 2,
    },
    {
        "title": "IPC §304A — Death by Negligence",
        "text": "Section 304A IPC: Whoever causes the death of any person by doing any rash or negligent act not amounting to culpable homicide, shall be punished with imprisonment of either description for a term which may extend to two years, or with fine, or with both. This section applies to cases of motor accident deaths, medical negligence, and industrial accidents where there is no intention to cause death.",
        "source_type": "text", "file_name": "IPC_1860.txt", "page": 2,
    },
    {
        "title": "IPC §375 & §376 — Rape and Punishment",
        "text": "Section 375 IPC: A man is said to commit 'rape' if he penetrates his penis, to any extent, into the vagina, mouth, urethra or anus of a woman or makes her to do so with him or any other person; or inserts, to any extent, any object or a part of the body, not being the penis, into the vagina, the urethra or anus of a woman or makes her to do so with him or any other person. Section 376 IPC: Whoever commits rape shall be punished with rigorous imprisonment of either description for a term which shall not be less than ten years, but which may extend to imprisonment for life, and shall also be liable to fine. In cases of aggravated rape (gang rape, rape of minors), the punishment extends to death or life imprisonment.",
        "source_type": "text", "file_name": "IPC_1860.txt", "page": 4,
    },
    {
        "title": "IPC §420 — Cheating",
        "text": "Section 420 IPC: Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person, or to make, alter or destroy the whole or any part of a valuable security, or anything which is signed or sealed, and which is capable of being converted into a valuable security, shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine.",
        "source_type": "text", "file_name": "IPC_1860.txt", "page": 5,
    },
    {
        "title": "IPC §498A — Cruelty by Husband or Relatives",
        "text": "Section 498A IPC: Whoever, being the husband or the relative of the husband of a woman, subjects such woman to cruelty shall be punished with imprisonment for a term which may extend to three years and shall also be liable to fine. 'Cruelty' means: (a) any wilful conduct which is of such a nature as is likely to drive the woman to commit suicide or to cause grave injury or danger to life, limb or health (whether mental or physical) of the woman; or (b) harassment of the woman where such harassment is with a view to coercing her or any person related to her to meet any unlawful demand for any dowry or other property.",
        "source_type": "text", "file_name": "IPC_1860.txt", "page": 6,
    },
    {
        "title": "Constitution of India — Article 14: Right to Equality",
        "text": "Article 14: The State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India. This article embodies two concepts: equality before law (a negative concept — the absence of any special privilege in favour of any individual) and equal protection of laws (a positive concept — equal treatment in equal circumstances). The Supreme Court has held that Article 14 strikes at arbitrariness in State action and ensures fairness and equality of treatment.",
        "source_type": "text", "file_name": "Constitution_of_India.txt", "page": 10,
    },
    {
        "title": "Constitution of India — Article 19: Right to Freedom",
        "text": "Article 19: All citizens shall have the right (a) to freedom of speech and expression; (b) to assemble peaceably and without arms; (c) to form associations or unions; (d) to move freely throughout the territory of India; (e) to reside and settle in any part of the territory of India; and (g) to practise any profession, or to carry on any occupation, trade or business. These rights are subject to reasonable restrictions under Articles 19(2) to 19(6) on grounds of sovereignty and integrity of India, security of the State, friendly relations with foreign States, public order, decency or morality.",
        "source_type": "text", "file_name": "Constitution_of_India.txt", "page": 11,
    },
    {
        "title": "Constitution of India — Article 21: Right to Life and Personal Liberty",
        "text": "Article 21: No person shall be deprived of his life or personal liberty except according to procedure established by law. The Supreme Court in Maneka Gandhi v. Union of India (1978) expanded this to include the right to live with human dignity. Article 21 has been interpreted to include the right to education, right to health, right to privacy (K.S. Puttaswamy v. Union of India, 2017), right to a clean environment, right to legal aid, right to speedy trial, right to travel abroad, and protection against solitary confinement.",
        "source_type": "text", "file_name": "Constitution_of_India.txt", "page": 11,
    },
    {
        "title": "Constitution of India — Article 22: Protection Against Arrest",
        "text": "Article 22: No person who is arrested shall be detained in custody without being informed, as soon as may be, of the grounds for such arrest nor shall he be denied the right to consult, and to be defended by, a legal practitioner of his choice. Every person who is arrested and detained in custody shall be produced before the nearest magistrate within a period of twenty-four hours of such arrest. The right under Article 22 is available to both citizens and non-citizens. Preventive detention laws must comply with Article 22(4) to 22(7).",
        "source_type": "text", "file_name": "Constitution_of_India.txt", "page": 12,
    },
    {
        "title": "CrPC §154 — First Information Report (FIR)",
        "text": "Section 154 CrPC: Every information relating to the commission of a cognizable offence, if given orally to an officer in charge of a police station, shall be reduced to writing by him or under his direction, and be read over to the informant; and every such information, whether given in writing or reduced to writing as aforesaid, shall be signed by the person giving it, and the substance thereof shall be entered in a book to be kept by such officer in such form as the State Government may prescribe. A copy of the FIR must be given to the informant free of cost. In Lalita Kumari v. Govt. of U.P. (2014), the Supreme Court held that registration of FIR is mandatory upon receipt of information disclosing a cognizable offence.",
        "source_type": "text", "file_name": "CrPC_1973.txt", "page": 20,
    },
    {
        "title": "CrPC §437 — Bail in Non-Bailable Offences",
        "text": "Section 437 CrPC: When any person accused of, or suspected of, the commission of any non-bailable offence is arrested or detained without warrant by an officer in charge of a police station or appears or is brought before a Court, he may be released on bail. The Court shall not grant bail if there appear reasonable grounds for believing that the person has been guilty of an offence punishable with death or imprisonment for life. Factors considered for bail: nature and gravity of charge, antecedents of the accused, possibility of fleeing from justice, and safety of the community.",
        "source_type": "text", "file_name": "CrPC_1973.txt", "page": 45,
    },
    {
        "title": "Maneka Gandhi v. Union of India (1978) — Landmark Judgment",
        "text": "Maneka Gandhi v. Union of India [1978] 1 SCC 248: The Supreme Court (7-judge bench) held that the procedure established by law under Article 21 must be right, just and fair and not arbitrary, fanciful or oppressive. The Court overruled A.K. Gopalan v. State of Madras (1950) and held that Articles 14, 19 and 21 are not mutually exclusive but form a golden triangle of fundamental rights. Justice Bhagwati held that personal liberty cannot be restricted except by a procedure which is reasonable, fair and just. This case is the foundation of expanded rights under Article 21.",
        "source_type": "text", "file_name": "Landmark_Cases.txt", "page": 1,
    },
    {
        "title": "Arnesh Kumar v. State of Bihar (2014) — Arrest Guidelines",
        "text": "Arnesh Kumar v. State of Bihar [2014] 8 SCC 273: The Supreme Court issued guidelines to prevent arbitrary arrests under Section 498A IPC and Section 4 of the Dowry Prohibition Act. The Court held that arrest should not be made as a matter of course and the police officer must be satisfied that arrest is necessary. Magistrates must apply their mind before authorizing detention. All State Governments were directed to instruct police officers not to automatically arrest upon registration of a case under Section 498A IPC. This judgment significantly curbed misuse of the provision.",
        "source_type": "text", "file_name": "Landmark_Cases.txt", "page": 2,
    },
    {
        "title": "D.K. Basu v. State of West Bengal (1997) — Custodial Rights",
        "text": "D.K. Basu v. State of West Bengal [1997] 1 SCC 416: The Supreme Court laid down binding guidelines for arrest and detention to prevent custodial violence and torture. Key requirements: (1) Police must bear accurate, visible identification; (2) A memo of arrest must be prepared; (3) One friend or relative must be informed of the arrest; (4) The arrestee must be informed of the right to have a friend informed; (5) Medical examination must be done every 48 hours; (6) Copies of all documents must be sent to the Magistrate. Violation of these guidelines constitutes contempt of court.",
        "source_type": "text", "file_name": "Landmark_Cases.txt", "page": 3,
    },
    {
        "title": "K.S. Puttaswamy v. Union of India (2017) — Right to Privacy",
        "text": "Justice K.S. Puttaswamy (Retd.) v. Union of India [2017] 10 SCC 1: A 9-judge constitutional bench unanimously held that the right to privacy is a fundamental right protected under Article 21 of the Constitution of India. The Court held that privacy is intrinsic to life and liberty and forms the core of the dignity of every individual. The judgment overruled M.P. Sharma v. Satish Chandra (1954) and Kharak Singh v. State of U.P. (1962). Privacy encompasses bodily integrity, personal autonomy, informational self-determination, and protection of identity.",
        "source_type": "text", "file_name": "Landmark_Cases.txt", "page": 4,
    },
]


def seed():
    print("Seeding ThemisAI vector database...")
    client = get_qdrant_client()
    ensure_collections(client)

    texts = [item["text"] for item in IPC_SEED]
    print(f"Embedding {len(texts)} documents...")
    vectors = embed_texts(texts)

    points = []
    for item, vector in zip(IPC_SEED, vectors):
        points.append(PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload={
                "text": item["text"],
                "title": item["title"],
                "page": item.get("page", 1),
                "chunk_idx": 0,
                "file_name": item["file_name"],
                "source_type": item["source_type"],
            },
        ))

    upsert_text_points(client, points)
    print(f"✓ Seeded {len(points)} documents into Qdrant.")


if __name__ == "__main__":
    seed()
