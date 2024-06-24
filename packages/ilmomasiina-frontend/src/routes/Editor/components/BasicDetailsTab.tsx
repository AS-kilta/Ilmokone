import React, { useEffect, useRef } from 'react';

import { Form } from 'react-bootstrap';
import { useForm } from 'react-final-form';
import { useTranslation } from 'react-i18next';
import Combobox from 'react-widgets/Combobox';

import { FieldRow } from '@tietokilta/ilmomasiina-components';
import { checkingSlugAvailability, checkSlugAvailability, loadCategories } from '../../../modules/editor/actions';
import { EditorEventType } from '../../../modules/editor/types';
import { useTypedDispatch, useTypedSelector } from '../../../store/reducers';
import DateTimePicker from './DateTimePicker';
import { useFieldTouched, useFieldValue } from './hooks';
import SelectBox from './SelectBox';
import SlugField from './SlugField';
import Textarea from './Textarea';

// How long to wait (in ms) for the user to finish typing the slug before checking it.
const SLUG_CHECK_DELAY = 250;

const GenerateSlug = () => {
  const isNew = useTypedSelector((state) => state.editor.isNew);
  const form = useForm();
  const title = useFieldValue<string>('title');
  const touched = useFieldTouched('slug');

  useEffect(() => {
    if (isNew && !touched && title !== undefined) {
      const generatedSlug = title
        .normalize('NFD') // converts e.g. ä to a + umlaut
        .replace(/[^A-Za-z0-9]+/g, '')
        .toLocaleLowerCase('fi');
      form.change('slug', generatedSlug);
    }
  }, [form, isNew, title, touched]);

  return null;
};

const SlugAvailability = () => {
  const slugAvailability = useTypedSelector((state) => state.editor.slugAvailability);
  const eventId = useTypedSelector((state) => state.editor.event?.id);
  const dispatch = useTypedDispatch();
  const { t } = useTranslation();

  const slug = useFieldValue<string>('slug');

  const checkDelay = useRef<number | undefined>();
  useEffect(() => {
    dispatch(checkingSlugAvailability());
    window.clearTimeout(checkDelay.current);
    checkDelay.current = window.setTimeout(() => {
      if (slug) {
        dispatch(checkSlugAvailability(slug));
      }
    }, SLUG_CHECK_DELAY);
  }, [dispatch, slug]);

  if (slugAvailability === 'checking') {
    return <Form.Text>{t('editor.basic.url.checking')}</Form.Text>;
  }
  if (slugAvailability === null) {
    return null;
  }
  if (slugAvailability.id === null || slugAvailability.id === eventId) {
    return <Form.Text className="text-success">{t('editor.basic.url.free')}</Form.Text>;
  }
  return (
    <Form.Text className="text-danger">
      {t('editor.basic.url.reserved', { event: slugAvailability.title })}
    </Form.Text>
  );
};

const BasicDetailsTab = () => {
  const dispatch = useTypedDispatch();
  const allCategories = useTypedSelector((state) => state.editor.allCategories);
  const { t } = useTranslation();

  const eventType = useFieldValue<EditorEventType>('eventType');
  const date = useFieldValue<Date | null>('date');
  const endDate = useFieldValue<Date | null>('date');

  useEffect(() => {
    dispatch(loadCategories());
  }, [dispatch]);

  return (
    <div>
      <FieldRow
        name="title"
        label={t('editor.basic.name')}
        required
        alternateError={t('editor.basic.name.missing')}
      />
      <GenerateSlug />
      <FieldRow
        name="slug"
        label={t('editor.basic.url')}
        required
        alternateError={t('editor.basic.url.missing')}
        extraFeedback={<SlugAvailability />}
        as={SlugField}
      />
      <FieldRow
        name="listed"
        label={t('editor.basic.listed')}
        as={Form.Check}
        type="checkbox"
        checkAlign
        checkLabel={t('editor.basic.listed.check')}
        help={t('editor.basic.listed.info')}
      />
      <FieldRow
        name="eventType"
        label={t('editor.basic.type')}
        as={SelectBox}
        options={[
          [EditorEventType.ONLY_EVENT, t('editor.basic.type.onlyEvent')],
          [EditorEventType.EVENT_WITH_SIGNUP, t('editor.basic.type.eventWithSignup')],
          [EditorEventType.ONLY_SIGNUP, t('editor.basic.type.onlySignup')],
        ]}
      />
      {eventType !== EditorEventType.ONLY_SIGNUP && (
        <FieldRow
          name="date"
          id="date"
          label={t('editor.basic.startDate')}
          as={DateTimePicker}
          selectsStart
          endDate={endDate}
          required
          alternateError={t('editor.basic.startDate.missing')}
        />
      )}
      {eventType !== EditorEventType.ONLY_SIGNUP && (
        <FieldRow
          name="endDate"
          id="endDate"
          label={t('editor.basic.endDate')}
          as={DateTimePicker}
          selectsEnd
          startDate={date}
          help={t('editor.basic.endDate.info')}
        />
      )}
      <FieldRow
        name="category"
        label={t('editor.basic.category')}
        as={Combobox}
        data={allCategories || []}
        busy={allCategories === null}
      />
      <FieldRow
        name="webpageUrl"
        label={t('editor.basic.homePage')}
      />
      <FieldRow
        name="facebookUrl"
        label={t('editor.basic.facebook')}
      />
      <FieldRow
        name="location"
        label={t('editor.basic.location')}
      />
      <FieldRow
        name="description"
        label={t('editor.basic.description')}
        help={t('editor.basic.description.info')}
        as={Textarea}
        rows={8}
      />
      <div>
        <h1>Nopea Markdown ohje</h1>
        <p>
          Markdown on helppo syntaksi nopeaan tekstin muotoiluun. Voit tarkasta tulokset julkaisemalla
          ilmottautuminen ylhäältä ja klikkaamalla 'Julkaistu'. Kannattaa piilottaa ilmottautuminen
          ellet halua sen näkyvän julkisessa listauksessa.
        </p>
        <h2>Perusteksti</h2>
        <p>
          Normaali teksti tulkitaan samaksi kappaleeksi yhdestä rivinvaihdosta huolimatta. Uuden kappaleen
          saat kahdella rivinvaihdolla. Yleisesti toivottava tapa on jättää tyhjä rivi jokaisen
          Markdown elementin väliin, sillä jotkin syntaksit saattavat tuottaa yllättäviä yhteisvaikutuksia.
          Esimerkiksi teksti ja seuraavalle riville kirjoitettu --- (Väliviiva) tuottaakin tekstista Otsikko 2.
        </p>
        <h2>Cheat Sheet</h2>
        <table className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>Kirjoita</th>
              <th>…saadaksesi</th>
              <th>Huomioitavaa</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>*Italic*</td>
              <td><em>Italic</em></td>
              <td>Voit käyttää myös _Italic_</td>
            </tr>
            <tr>
              <td>**Bold**</td>
              <td><strong>Bold</strong></td>
              <td>Voit käyttää myös __Bold__</td>
            </tr>
            <tr>
              <td>~Yliviivaus~</td>
              <td>
                <s>Yliviivaus</s>
              </td>
              <td />
            </tr>
            <tr>
              <td># Otsikko 1</td>
              <td><h1>Otsikko 1</h1></td>
              <td />
            </tr>
            <tr>
              <td>## Otsikko 2</td>
              <td><h2>Otsikko 2</h2></td>
              <td />
            </tr>
            <tr>
              <td>### Otsikko 3</td>
              <td><h3>Otsikko 3</h3></td>
              <td />
            </tr>
            <tr>
              <td>[Linkki](https://ilmo.as.fi/)</td>
              <td><a href="https://ilmo.as.fi/">Linkki</a></td>
              <td />
            </tr>
            <tr>
              <td>![AS-Ilmokone](ilmo.as.fi)</td>
              <td><img src="https://ilmo.as.fi/public/favicon-32x32.png" alt="AS-Ilmokone" /></td>
              <td />
            </tr>
            <tr>
              <td>
                {'>'}
                {' '}
                Lainaus
              </td>
              <td>
                <blockquote>Lainaus</blockquote>
              </td>
              <td />
            </tr>
            <tr>
              <td>
                * Lista
                <br />
                * Lista
                <br />
                * Lista
              </td>
              <td>
                <ul>
                  <li>Lista</li>
                  <li>Lista</li>
                  <li>Lista</li>
                </ul>
              </td>
              <td />
            </tr>
            <tr>
              <td>
                1. Lista
                <br />
                2. Lista
                <br />
                3. Lista
              </td>
              <td>
                <ol>
                  <li>Lista</li>
                  <li>Lista</li>
                  <li>Lista</li>
                </ol>
              </td>
              <td />
            </tr>
            <tr>
              <td>---</td>
              <td>
                <hr />
              </td>
              <td>Sisällönjakaja</td>
            </tr>
            <tr>
              <td>
                `Koodi`
              </td>
              <td>
                <code>Koodi tekstin sisällä</code>
              </td>
              <td>Taakse taittuva aksentti (backtick)</td>
            </tr>
            <tr>
              <td>
                ```
                <br />
                Koodipalikka
                <br />
                ```
              </td>
              <td><code>Koodipalikka</code></td>
              <td/>
            </tr>
            <tr>
              <td>https://ilmo.as.fi</td>
              <td><a href="https://ilmo.as.fi/">https://ilmo.as.fi</a></td>
              <td>URL-osotteet muuttuvat linkeiksi</td>
            </tr>

            <tr>
              <td>Alaviite [^1]<br/>[^1]: Tämä on alaviite</td>
              <td />
              <td />
            </tr>
            <tr>
              <td>
                | Syntaksi | Tulos |
                <br />
                {' '}
                |–––|–––|
                <br />
                | ** | Italic |
                <br />
                | **** | Bold |
              </td>
              <td>
                <table>
                  <thead>
                    <tr>
                      <td>Syntaksi</td>
                      <td>Tulos</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>**</td>
                      <td>Italic</td>
                    </tr>
                    <tr>
                      <td>****</td>
                      <td>Bold</td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td>Taulukon kokoa voi lisätä lisäämällä rivejä ja </td>
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BasicDetailsTab;
