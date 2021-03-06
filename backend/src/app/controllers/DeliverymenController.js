import * as Yup from 'yup';

import { Op } from 'sequelize';
import Deliverymen from '../models/Deliverymen';
import File from '../models/Files';

class DeliverymenController {
  async index(req, res) {
    const { nome } = req.params;
    let deliverymenExists;
    if (nome.trim() !== '""') {
      deliverymenExists = await Deliverymen.findAll({
        where: {
          name: {
            [Op.iLike]: `%${nome}%`,
          },
        },
        include: [
          {
            model: File,
            as: 'avatar',
            attributes: ['id', 'path', 'url'],
          },
        ],
      });
    } else {
      deliverymenExists = await Deliverymen.findAll({
        include: [
          {
            model: File,
            as: 'avatar',
            attributes: ['id', 'path', 'url'],
          },
        ],
      });
    }

    if (!deliverymenExists) {
      return res.status(400).json({ error: 'Deliverymen dont exists.' });
    }

    return res.json(deliverymenExists);
  }

  async store(req, res) {
    const deliverymenExists = await Deliverymen.findOne({
      where: { email: req.body.email },
    });

    if (deliverymenExists) {
      return res.status(400).json({ error: 'Deliveryman already exists.' });
    }

    // retorna do cadastro apenas os campos necessários
    const { id, name, email } = await Deliverymen.create(req.body);

    return res.json({
      id,
      name,
      email,
    });
  }

  async delete(req, res) {
    const deliverymenExists = await Deliverymen.findByPk(req.params.id);

    if (!deliverymenExists) {
      return res.status(400).json({ error: 'Deliveryman does not exists.' });
    }

    await deliverymenExists.destroy();

    return res.json({ message: 'Record successfully deleted ' });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
    });
    /**
     * Verificando se os dados enviados no req.body
     * estão de acordo com o schema
     *
     * isValid é uma funcao assincrona, e verifica se o req.body bate com o schema
     */
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'validation fails' });
    }

    const { id, email } = req.body;

    const deliveryman = await Deliverymen.findByPk(id);

    if (!deliveryman) {
      return res.status(400).json({ error: 'Deliveryman does not exists.' });
    }
    /**
     * Se o e-mail for diferente do que está base para o entregador e já existir
     * esse e-mail na base, apresenta erro
     */
    if (email && email !== deliveryman.email) {
      const deliverymanExists = await Deliverymen.findOne({ where: { email } });

      if (deliverymanExists) {
        return res.status(400).json({ error: 'Deliveryman already exists' });
      }
    }

    await deliveryman.update(req.body);

    const { name, avatar, email: email_atu } = await Deliverymen.findByPk(id, {
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    return res.json({
      id,
      name,
      email_atu,
      avatar,
    });
  }
}

export default new DeliverymenController();
