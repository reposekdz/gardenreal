/**
 * Script to add enhanced SMS templates to the database
 * Run with: node backend/scripts/add_enhanced_sms_templates.js
 */

const db = require('../db');

const templates = [
    {
        key: 'student_created',
        name: 'Umunyeshuri yanditswe',
        rw: 'Murakaza neza {{parent_name}}! Umwana wawe {{student_name}} yanditswe muri Garden TVET School. Nimero: {{reg_number}}. Trade: {{trade}}, Level: {{level}}.',
        en: 'Welcome {{parent_name}}! Your child {{student_name}} has been registered at Garden TVET School. Reg: {{reg_number}}. Trade: {{trade}}, Level: {{level}}.',
        fr: 'Bienvenue {{parent_name}}! Votre enfant {{student_name}} a été enregistré à Garden TVET School. N°: {{reg_number}}. Métier: {{trade}}, Niveau: {{level}}.'
    },
    {
        key: 'student_updated',
        name: 'Amakuru yahinduwe',
        rw: 'Murikana {{parent_name}}, amakuru ya {{student_name}} yahinduwe muri Garden TVET. {{changes}}',
        en: 'Dear {{parent_name}}, {{student_name}}\'s information has been updated at Garden TVET. {{changes}}',
        fr: 'Cher {{parent_name}}, les informations de {{student_name}} ont été mises à jour à Garden TVET. {{changes}}'
    },
    {
        key: 'student_removed',
        name: 'Umunyeshuri yasibwe',
        rw: 'Murikana {{parent_name}}, umwana wawe {{student_name}} yasibwe muri Garden TVET School. {{reason}}',
        en: 'Dear {{parent_name}}, your child {{student_name}} has been removed from Garden TVET School. {{reason}}',
        fr: 'Cher {{parent_name}}, votre enfant {{student_name}} a été retiré de Garden TVET School. {{reason}}'
    },
    {
        key: 'student_on_leave',
        name: 'Umwana ku ruhushya',
        rw: 'Murikana {{parent_name}}, umwana wawe {{student_name}} yarasabwe uruhushya rwo kuva ishuri{{return_date}}. Impamvu: {{reason}}.',
        en: 'Dear {{parent_name}}, your child {{student_name}} has been granted leave from school{{return_date}}. Reason: {{reason}}.',
        fr: 'Cher {{parent_name}}, votre enfant {{student_name}} a été autorisé à quitter l\'école{{return_date}}. Raison: {{reason}}.'
    },
    {
        key: 'student_reinstated',
        name: 'Umunyeshuri yagaruwe',
        rw: 'Murikana {{parent_name}}, umwana wawe {{student_name}} agaruriwe mu nzego nziza muri Garden TVET School. {{resolution}}',
        en: 'Dear {{parent_name}}, your child {{student_name}} has been reinstated at Garden TVET School. {{resolution}}',
        fr: 'Cher {{parent_name}}, votre enfant {{student_name}} a été réintégré à Garden TVET School. {{resolution}}'
    },
    {
        key: 'grade_updated',
        name: 'Ikigereranyo cyahinduwe',
        rw: 'Murikana {{parent_name}}, ikigereranyo cya {{subject}} cya {{student_name}} cyahinduwe. Score: {{score}}/{{max_score}} ({{grade}}).',
        en: 'Dear {{parent_name}}, {{student_name}}\'s grade for {{subject}} has been updated. Score: {{score}}/{{max_score}} ({{grade}}).',
        fr: 'Cher {{parent_name}}, la note de {{subject}} pour {{student_name}} a été mise à jour. Score: {{score}}/{{max_score}} ({{grade}}).'
    },
    {
        key: 'link_request_received',
        name: 'Icyifuzo cyabajwe',
        rw: 'Murakaza neza {{parent_name}}! Icyifuzo cyawe cyo guhuza n\'umwana cyabajwe. Uzabihabira igihe.',
        en: 'Welcome {{parent_name}}! Your request to link with a student has been received. You will be notified soon.',
        fr: 'Bienvenue {{parent_name}}! Votre demande de liaison avec un étudiant a été reçue. Vous serez bientôt notifié.'
    },
    {
        key: 'link_rejected',
        name: 'Icyifuzo cyanzwe',
        rw: 'Murikana {{parent_name}}, ikifuzo cyawe cyo guhuza n\'umwana cyanzwe. {{reason}} Utumanikire: +250 780 000 000.',
        en: 'Dear {{parent_name}}, your request to link with a student has been rejected. {{reason}} Contact: +250 780 000 000.',
        fr: 'Cher {{parent_name}}, votre demande de liaison avec un étudiant a été rejetée. {{reason}} Contact: +250 780 000 000.'
    },
    {
        key: 'staff_deleted',
        name: 'Konti yasibye',
        rw: 'Murikana {{staff_name}}, konti yawe ya Garden TVET School yasibwe na {{deleted_by}}. Mungire ibitekerezo: +250 780 000 000.',
        en: 'Dear {{staff_name}}, your Garden TVET School account has been deleted by {{deleted_by}}. Contact: +250 780 000 000.',
        fr: 'Cher {{staff_name}}, votre compte Garden TVET School a été supprimé par {{deleted_by}}. Contact: +250 780 000 000.'
    },
    {
        key: 'staff_updated',
        name: 'Amakuru yahinduwe (Staff)',
        rw: '{{staff_name}}, amakuru yawe ya Garden TVET yahinduwe. {{changes}}.',
        en: '{{staff_name}}, your Garden TVET information has been updated. {{changes}}.',
        fr: '{{staff_name}}, vos informations Garden TVET ont été mises à jour. {{changes}}.'
    },
    {
        key: 'password_changed',
        name: 'Ijambobanga ryahinduwe',
        rw: '{{name}}, ijambobanga ryawe ryahinduwe kuri Garden TVET. Niba si we, itumanikire vuba.',
        en: '{{name}}, your password has been changed at Garden TVET. Contact school if this wasn\'t you.',
        fr: '{{name}}, votre mot de passe a été changé à Garden TVET. Contactez l\'école si ce n\'était pas vous.'
    },
    {
        key: 'parent_registered',
        name: 'Umubyeyi yanditswe',
        rw: 'Murakaza neza {{parent_name}} kuri Garden TVET School! Konti yawe nk\'umubyeyi yashyizweho neza.',
        en: 'Welcome {{parent_name}} to Garden TVET School! Your parent account is ready.',
        fr: 'Bienvenue {{parent_name}} à Garden TVET School! Votre compte parent est prêt.'
    },
    {
        key: 'application_received',
        name: 'Icyifuzo cyabajwe (Apply)',
        rw: '{{name}}, twabajye ikifuzo cyawe. Uzabihabira igihe.',
        en: 'We have received your application. You will be notified soon.',
        fr: 'Nous avons reçu votre demande. Vous serez bientôt notifié.'
    },
    {
        key: 'application_approved',
        name: 'Icyifuzo cyemerewe (Apply)',
        rw: '{{name}}, ikifuzo cyawe cyemerewe! Ubu urashobora kwandika. Murakoze!',
        en: 'Your application has been approved! You can now register. Thank you!',
        fr: 'Votre demande a été approuvée! Vous pouvez maintenant vous inscrire. Merci!'
    },
    {
        key: 'application_rejected',
        name: 'Icyifuzo cyanzwe (Apply)',
        rw: '{{name}}, ikifuzo cyawe cyanzwe. Utumanikire.',
        en: 'Your application has been rejected. Contact school for more info.',
        fr: 'Votre demande a été rejetée. Contactez l\'école pour plus d\'informations.'
    },
    {
        key: 'general_announcement',
        name: 'Itangazo',
        rw: '{{parent_name}}, {{message}} - Garden TVET',
        en: '{{parent_name}}, {{message}} - Garden TVET',
        fr: '{{parent_name}}, {{message}} - Garden TVET'
    }
];

async function addTemplates() {
    console.log('Adding enhanced SMS templates...');

    let added = 0;
    let skipped = 0;

    for (const t of templates) {
        try {
            // Check if template already exists
            const [existing] = await db.execute(
                'SELECT id FROM sms_templates WHERE template_key = ?',
                [t.key]
            );

            if (existing.length > 0) {
                console.log(`  Skipping ${t.key} (already exists)`);
                skipped++;
                continue;
            }

            await db.execute(
                `INSERT INTO sms_templates (template_key, template_name, message_rw, message_en, message_fr, is_active) 
                 VALUES (?, ?, ?, ?, ?, TRUE)`,
                [t.key, t.name, t.rw, t.en, t.fr]
            );

            console.log(`  Added: ${t.key}`);
            added++;
        } catch (err) {
            console.error(`  Error adding ${t.key}:`, err.message);
        }
    }

    console.log(`\nDone! Added: ${added}, Skipped: ${skipped}`);
    process.exit(0);
}

addTemplates().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
