import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import { AnalysisResult } from '@/types/resume';
import { getResumeSkills } from './resumeSkills';

function formatEducationLabel(graduationYear: string): string {
  const value = graduationYear.trim();
  return value || 'Em andamento';
}

function createSectionHeading(title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text: title, bold: true })],
    spacing: { before: 240, after: 120 },
  });
}

function createBullet(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    children: [new TextRun(text)],
    spacing: { after: 60 },
  });
}

function createTextParagraph(text: string, bold = false): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold })],
    spacing: { after: 80 },
  });
}

export async function generateDocxBuffer(data: AnalysisResult): Promise<Buffer> {
  const { extractedData, correctedResume } = data;
  const summary = correctedResume.summary || extractedData.summary;
  const experienceItems =
    correctedResume.experienceRewritten.length > 0
      ? correctedResume.experienceRewritten
      : extractedData.experience;
  const skills = getResumeSkills(data);

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: extractedData.name || 'Currículo ATS',
          bold: true,
          size: 28,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: [
            extractedData.email,
            extractedData.phone,
            extractedData.location,
            extractedData.linkedin,
          ]
            .filter(Boolean)
            .join(' | '),
          size: 20,
        }),
      ],
    }),
    createSectionHeading('Resumo Profissional'),
    createTextParagraph(summary || 'Resumo não identificado na extração do currículo.'),
    createSectionHeading('Experiência Profissional'),
  ];

  if (experienceItems.length > 0) {
    experienceItems.forEach((experience) => {
      children.push(
        createTextParagraph(`${experience.role || 'Cargo não informado'} — ${experience.company || 'Empresa não informada'}`, true),
        createTextParagraph(`${experience.startDate || ''} — ${experience.endDate || ''}`),
      );

      (experience.bulletPoints || []).forEach((bulletPoint) => {
        children.push(createBullet(bulletPoint.replace(/^•\s*/, '')));
      });
    });
  } else {
    children.push(createTextParagraph('Experiência não identificada na extração do currículo.'));
  }

  children.push(createSectionHeading('Educação'));
  if (extractedData.education.length > 0) {
    extractedData.education.forEach((education) => {
      const degree = [education.degree, education.field ? `em ${education.field}` : '']
        .filter(Boolean)
        .join(' ')
        .trim();
      const graduationYear = formatEducationLabel(education.graduationYear || '');
      children.push(
        createTextParagraph(
          `${degree || 'Formação'} — ${education.institution || 'Instituição não informada'} (${graduationYear})`,
        ),
      );
    });
  } else {
    children.push(createTextParagraph('Educação não identificada na extração do currículo.'));
  }

  children.push(createSectionHeading('Habilidades'));
  if (skills.length > 0) {
    skills.forEach((skill) => {
      children.push(createBullet(skill));
    });
  } else {
    children.push(createTextParagraph('Habilidades não identificadas na extração do currículo.'));
  }

  if (extractedData.certifications.length > 0) {
    children.push(createSectionHeading('Certificações'));
    extractedData.certifications.forEach((certification) => {
      children.push(createTextParagraph(certification));
    });
  }

  if (extractedData.languages.length > 0) {
    children.push(createSectionHeading('Idiomas'));
    extractedData.languages.forEach((language) => {
      children.push(createTextParagraph(`${language.language}: ${language.level}`));
    });
  }

  const document = new Document({
    sections: [{ children }],
  });

  const buffer = await Packer.toBuffer(document);
  return Buffer.from(buffer);
}
