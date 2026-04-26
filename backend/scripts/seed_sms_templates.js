/**
 * Script to seed/update SMS templates with professional Kinyarwanda versions
 */
require('dotenv').config();
const { getDb } = require('../db');

const templates = [
    {
        template_key: 'attendance_report',
        template_name: 'Raporo yo Kuhari',
        message_rw: 'Muraho {{parent_name}}, tura kumenyesha ko umwana wawe {{student_name}} {{status_rw}} mu ishuri uyu munsi tariki {{date}}.{{notes}} - Garden TVET',
        message_en: 'Dear {{parent_name}}, we notify you that your child {{student_name}} {{status}} from school today {{date}}.{{notes}} - Garden TVET',
        message_fr: 'Cher {{parent_name}}, nous vous informons que votre enfant {{student_name}} était {{status}} de l\'école aujourd\'hui {{date}}.{{notes}} - Garden TVET'
    },
    {
        template_key: 'discipline_incident',
        template_name: 'Imyitwarire mibi',
        message_rw: 'Muraho {{parent_name}}, tura kumenyesha ko {{student_name}} yagize ikibazo cy\'imyitwarire ({{type}}): {{description}}. - Garden TVET',
        message_en: 'Dear {{parent_name}}, we notify you that {{student_name}} had a disciplinary issue ({{type}}): {{description}}. - Garden TVET',
        message_fr: 'Cher {{parent_name}}, nous vous informons que {{student_name}} a eu un incident disciplinaire ({{type}}): {{description}}. - Garden TVET'
    },
    {
        template_key: 'grade_added',
        template_name: 'Amanota Mashya',
        message_rw: 'Muraho {{parent_name}}, umwana wawe {{student_name}} yatsindiye amanota mu isomo rya {{subject}}: {{score}}/{{max_score}} ({{grade}}). - Garden TVET',
        message_en: 'Dear {{parent_name}}, your child {{student_name}} received grades for {{subject}}: {{score}}/{{max_score}} ({{grade}}). - Garden TVET',
        message_fr: 'Cher {{parent_name}}, votre enfant {{student_name}} a reçu des notes pour {{subject}}: {{score}}/{{max_score}} ({{grade}}). - Garden TVET'
    },
    {
        template_key: 'link_approved',
        template_name: 'Guhuza Kwemejwe',
        message_rw: 'Muraho {{parent_name}}, ubusabe bwawe bwo guhuza n\'umwana {{student_name}} ({{reg_number}}) bwemejwe. Ubu urashobora kureba amakuru ye kuri Portal. - Garden TVET',
        message_en: 'Dear {{parent_name}}, your request to link with {{student_name}} ({{reg_number}}) has been approved. You can now view their records on the Portal. - Garden TVET',
        message_fr: 'Cher {{parent_name}}, votre demande de liaison avec {{student_name}} ({{reg_number}}) a été approuvée. Vous pouvez maintenant voir ses dossiers sur le Portail. - Garden TVET'
    },
    {
        template_key: 'payment_received',
        template_name: 'Ubwishyu Bwakiriwe',
        message_rw: 'Muraho {{parent_name}}, twabonye ubwishyu bwa {{amount}} RWF bwo kwiga bwa {{student_name}}. Hasigaye {{balance}} RWF. Murakoze. - Garden TVET',
        message_en: 'Dear {{parent_name}}, we have received payment of {{amount}} RWF for {{student_name}}. Balance: {{balance}} RWF. Thank you. - Garden TVET',
        message_fr: 'Cher {{parent_name}}, nous avons reçu le paiement de {{amount}} RWF pour {{student_name}}. Solde: {{balance}} RWF. Merci. - Garden TVET'
    },
    {
        template_key: 'student_created',
        template_name: 'Umunyeshuri Yanditswe',
        message_rw: 'Murakaza neza! Umwana {{student_name}} yanditswe muri Garden TVET School. Reg: {{reg_number}}. {{trade}} - {{level}}. - Garden TVET',
        message_en: 'Welcome! {{student_name}} has been registered at Garden TVET School. Reg: {{reg_number}}. {{trade}} - {{level}}. - Garden TVET',
        message_fr: 'Bienvenue! {{student_name}} a été inscrit à Garden TVET School. Reg: {{reg_number}}. {{trade}} - {{level}}. - Garden TVET'
    }
];

async function seed() {
    const db = getDb();
    console.log('Starting SMS template seeding...');

    for (const t of templates) {
        try {
            // Check if exists
            const [existing] = await db.query('SELECT id FROM sms_templates WHERE template_key = ?', [t.template_key]);
            
            if (existing.length > 0) {
                console.log(`Updating template: ${t.template_key}`);
                await db.query(
                    'UPDATE sms_templates SET template_name = ?, message_rw = ?, message_en = ?, message_fr = ?, is_active = 1, updated_at = NOW() WHERE template_key = ?',
                    [t.template_name, t.message_rw, t.message_en, t.message_fr, t.template_key]
                );
            } else {
                console.log(`Inserting template: ${t.template_key}`);
                await db.query(
                    'INSERT INTO sms_templates (template_key, template_name, message_rw, message_en, message_fr, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())',
                    [t.template_key, t.template_name, t.message_rw, t.message_en, t.message_fr]
                );
            }
        } catch (err) {
            console.error(`Error for ${t.template_key}:`, err.message);
        }
    }

    console.log('SMS template seeding completed.');
    process.exit(0);
}

seed();
