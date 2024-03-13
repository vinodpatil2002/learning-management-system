import mongoose, { Schema, Document ,Model} from 'mongoose';
import { IUser } from './user.model';

export interface IOrder extends Document {
    courseId: string;
    userId: string;
    paymentInfo: object;
}

const orderSchema = new Schema<IOrder>({
    courseId: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    paymentInfo: {
        type: Object,
        // required: true
    }
}, {
    timestamps: true
});

const OrderModel: Model<IOrder> = mongoose.model('Order', orderSchema);

export default OrderModel;