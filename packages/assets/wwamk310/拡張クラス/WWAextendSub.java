import java.applet.*;
import java.awt.*;
import java.awt.image.*;
import java.util.*;
import java.io.*;
import java.net.*;

//�u//�v�ȍ~�̕��̓R�����g�ɂȂ��Ă��܂��B
//�Ƃ肠������`�͓ǂݔ�΂��ăv���O�����{�̂̂P�U�O�s�ڈȍ~���猩�Ă݂Ă��������B

////////////////////////////////////////////////////////////////////////////////////////////////
//�e�ϐ��̈Ӗ�

// Valiable[�O�`�X�X]
//�V�X�e���Ŏ��R�Ɏg����ϐ��z��ł��B�Z�[�u�����[�h�ŋL�^�����ق��b�f�h�ł����M����܂��B

// Mode = 0		���̃p�[�c��ǂɐG�ꂽ�Ƃ���A���C�x���g���N��������
// Mode = 1		�v���[���[���P���ړ�������
// Mode = 2		�}�E�X��L�[�{�[�h�������ꂽ��
// Mode = 3		��ʂ�`�悷�鎞�i�ʏ�P�b�ɂT�O��j

// PlayerX, PlayerY		�v���[���[�̂w���W�A�x���W
// PartsObject	�v���[���[���G�ꂽ���̃p�[�c�ԍ�
// PartsMap		�v���[���[�̌��݈ʒu�̔w�i�p�[�c�ԍ�

// Energy, EnergyMax, Strength, Defence, Gold, Step
//�����́A�����͍ő�l�A�U���́A�h��́A�S�[���h�A�ړ���

// ImgChara, ImgButton, ImgEnergy, ImgStrength, ImgDefence, ImgGold, ImgBom, ImgStatusFrame, ImgMainFrame,
//�v���[���[�摜�A�{�^���摜�A�e��g�摜�̈ʒu�A�摜�ʒu�͍��W�ł͂Ȃ��i�w�{�x�~�P�O�j�Ŏw��

// ItemBox[�O�`�P�Q]
//�A�C�e���{�b�N�X

// Map[�x���W][�w���W] �� �p�[�c�ԍ�
//�}�b�v�ɔz�u����Ă���w�i�p�[�c
// Object[�x���W][�w���W] �� �p�[�c�ԍ�
//�}�b�v�ɔz�u����Ă��镨�̃p�[�c

// AtrMap[�w�i�ԍ�][�ϐ��w��] �� �e��X�e�[�^�X
//�w�i�p�[�c�̊e��f�[�^
// AtrObject[���̔ԍ�][�ϐ��w��] �� �e��X�e�[�^�X
//���̃p�[�c�̊e��f�[�^

// MapWidth, MapPartsMax, ObjectPartsMax, MesNumberMax,
//�}�b�v�S�̂̕��A�w�i�p�[�c�ő吔�A���̃p�[�c�ő吔�A���b�Z�[�W�ԍ��ő吔

// GlobalMessage[���b�Z�[�W�ԍ�]
// SystemMessage[�O�`�P�X]	�V�X�e���֘A���b�Z�[�W
//�p�[�c�Ŏg�p����Ă��郁�b�Z�[�W�B�w�i�p�[�c�Ȃ烁�b�Z�[�W�ԍ��́AAtrMap[�w�i�ԍ�][ATR_STRING]�Ŏw��

// ImgCrop[�摜�ԍ�]
//�S�O�~�S�O�h�b�g�̉摜���͂����Ă��܂��B�摜�ʒu�́A�ԍ����w�{�x�~�P�O�ɑΉ����Ă��܂��B
//�ォ��T��ځA������W�Ԗڂ̉摜�̔ԍ��́i�T�|�P�j�{�i�W�|�P�j�~�P�O���V�S�ɂȂ�܂��B

// Gr, GrMap, GrStatus
//�摜�������ݗp�̃I�u�W�F�N�g�ł��B
//�uGr�v�͂T�U�O�~�S�S�O�̕\��ʁA�uGrMap�v�͂S�S�O�~�S�S�O�̃}�b�v����ʁA�uGrMap�v�͂P�Q�O�~�S�S�O�̃X�e�[�^�X����ʂł��B
//����ʂ�GrMap��GrStatus�̕`����e���\��ʂ�Gr�ɕ`�悳��܂��B
//���炿���������܂��̂Œʏ�͕\��ʂ�Gr�ɒ��ڂ͕`�悵�܂���B

// bSaveStop, bDefault, bPaintAll, bAnmItem, 
//�Z�[�u�֎~�t���O�A$default�t���O�A�S��ʕ`��t���O�A�A�C�e���擾���̃A�j���t���O

// MusicNumber
//�炷�T�E���h�̔ԍ�

// TimerCount
//�`�斈�̑҂�����

// bStopInput
//true�ŃL�[���̖͂������i�A�j���[�V�����C�x���g�ȂǂɎg�p�j

class WWAextendSub {

////////////////////////////////////////////////////////////////////////////////////////////////
//�p�[�c�f�[�^�p���l��`
//AtrMap[�w�i���][�ϐ��w��]��AtrObject[���̔ԍ�][�ϐ��w��]�̕ϐ��w��ɑΉ����܂��B
//ATR_NUMBER�Ȃǂ̓p�[�c�̎�ނɂ�舵�����ς��܂��B
static int ATR_CROP1 = 1;		//�p�[�c�摜�ʒu�P
static int ATR_CROP2 = 2;		//�p�[�c�摜�ʒu�Q
static int ATR_TYPE = 3;		//�p�[�c�̎��
static int ATR_MODE = 4;		//���p�r�i���̒ʍs�����A�g�p�^�A�C�e���A�������Ȃǁj
static int ATR_STRING = 5;		//�Ή����郁�b�Z�[�W�ԍ�
static int ATR_ENERGY = 10;		//���p�[�c�̃X�e�[�^�X
static int ATR_STRENGTH = 11;
static int ATR_DEFENCE = 12;
static int ATR_GOLD = 13;
static int ATR_ITEM = 14;		//���蔃������A�C�e���ԍ��Ȃ�
static int ATR_NUMBER = 15;		//���p�r�i�҂����ԁA�A�C�e���{�b�N�X�ʒu�A�������Ȃǁj
static int ATR_JUMP_X = 16;		//���W�����v��̂w�x���W
static int ATR_JUMP_Y = 17;
static int ATR_SOUND = 19;		//�T�E���h�ԍ�
static int ATR_MOVE = 16;		//�ړ�����

//AtrMap[�w�i�ԍ�][�ϐ��w��]�̃p�[�c�̎�ށi�ϐ��w�� = ATR_TYPE�j�ɑΉ����܂��B
static int MAP_STREET = 0;		//��
static int MAP_WALL = 1;		//��
static int MAP_LOCALGATE = 2;	//�W�����v�Q�[�g
static int MAP_URLGATE = 4;		//�t�q�k�Q�[�g

//AtrObject[���̔ԍ�][�ϐ��w��]�̃p�[�c�̎�ށi�ϐ��w�� = ATR_TYPE�j�ɑΉ����܂��B
static int OBJECT_NORMAL = 0;	//�ʏ함�̃p�[�c
static int OBJECT_MESSAGE = 1;	//���b�Z�[�W�p�[�c
static int OBJECT_URLGATE = 2;	//�t�q�k�Q�[�g
static int OBJECT_STATUS = 3;	//�X�e�[�^�X�ω�
static int OBJECT_ITEM = 4;		//�A�C�e��
static int OBJECT_DOOR = 5;		//��
static int OBJECT_MONSTER = 6;	//�����X�^�[
static int OBJECT_SCORE = 11;	//�X�R�A�\��
static int OBJECT_SELL = 14;	//�����𔄂�
static int OBJECT_BUY = 15;		//���𔃂�
static int OBJECT_RANDOM = 16;	//�����_���I��
static int OBJECT_SELECT = 17;	//��ґ���
static int OBJECT_LOCALGATE = 18;	//�W�����v�Q�[�g

////////////////////////////////////////////////////////////////////////////////////////////////
//�O���[�o���ϐ��̒�`
//�����Œ�`�����ϐ��̓Z�[�u�����[�h�ł͋L�^����܂��񂪁A�V�X�e�����I������܂œ��e���ێ�����܂��B

static boolean bMouseSkip = false; //�}�E�X�N���b�N�̃X�L�b�v����p
static boolean bAnimeFlag = false;
static int iAnimeCount;

////////////////////////////////////////////////////////////////////////////////////////////////
// �v���O�����{��

public static void Main(
	int Mode, int PartsObject, int PartsMap, int PlayerX, int PlayerY, char PlayerDirect, int PartsX, int PartsY,
	int Energy, int EnergyMax, int Strength, int Defence, int Gold, int Step, int TimerCount,
	int GameoverX, int GameoverY, int ImgChara, int ImgButton, int bSaveStop, int bDefault, boolean bPaintAll, boolean bStopInput, int bAnmItem, int MusicNumber,
	int ImgEnergy, int ImgStrength, int ImgDefence, int ImgGold, int ImgBom, int ImgStatusFrame, int ImgItemFrame, int ImgMainFrame, int ImgClickItem,
	int ItemBox[], int Valiable[],
	short Map[][], short Object[][],
	int Key, int MouseX, int MouseY,
	int MapWidth, int MapPartsMax, int ObjectPartsMax, int MesNumberMax,
	Graphics Gr, Graphics GrMap, Graphics GrStatus, Image ImgCrop[],
	int AtrMap[][], int AtrObject[][],
	String GlobalMessage[], String SystemMessage[]
){
	//�쐬�c�[�����Ńp�[�c�ɓ��͂��ꂽ���b�Z�[�W�𒊏o���uszMes�v�Ɋi�[���܂��B
	String szMes = null;
	if( Mode <= 2 ){
		int MessageNumber = 0;	//���b�Z�[�W�ԍ�
		//���̃p�[�c�Ƀ��b�Z�[�W���L�q����Ă���΂��̃��b�Z�[�W���i�[
		if( PartsObject != 0 ){
			MessageNumber = AtrObject[PartsObject][ATR_STRING];
			if( MessageNumber != 0 ) szMes = GlobalMessage[MessageNumber];
		}
		//���̃p�[�c���Ȃ��w�i�p�[�c�Ƀ��b�Z�[�W���L�q����Ă���΂��̃��b�Z�[�W���i�[
		else {
			MessageNumber = AtrMap[PartsMap][ATR_STRING];
			if( MessageNumber != 0 ) szMes = GlobalMessage[MessageNumber];
		}
	}

	////////////////////////////////////////////////////////////////////////////////////////////////
	// ����������悪���C���v���O�����łł��B
	// ���̕����������ł������Ă݂ċ������m�F���Ă��������B
	////////////////////////////////////////////////////////////////////////////////////////////////

	//����ҕ\�L�����܂��B�V�X�e���N�����ɁuCustomized by ...�v�ŕ\������܂��B
	String CopyRight = "�H�H�H";
	//�ԐM�p�̃��b�Z�[�W�ł��B������L�q����Ɩ{�̂̂ق��ł��̃��b�Z�[�W���\������܂��B
	//�ʋL�́uReturnMessage�Ɋւ���d�l�v���Q�Ƃ��Ă��������B
	String ReturnMessage = null;
	//��ʂ̍X�V�i�ʏ�͎g���܂���B�e��ݒ�ύX�ōX�V���ʂ���ʂɔ��f����Ȃ��Ƃ��Ɏg�p���Ă��������j
	boolean bReset = false;
	//Mode=0�̎��i�p�[�c�ɐG�ꂽ���j���̃p�[�c�ɐݒ肳�ꂽ�C�x���g�����s���邩���w�肵�܂��ibNoExec = true�Ŏ��s���ہj
	//�g���N���X���Ŗ{�̑��̃C�x���g�����s���邩����ł��܂��B
	//�Ǝ��ɏ�������}�N�������쐬�����Ƃ��ȂǂɎg�p���܂��B
	boolean bNoExec = false;

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//�uMode=0�v���̏������̒��̓v���[���[���ǂ╨�̃p�[�c�ɐG�ꂽ�Ƃ��ɌĂяo����܂��B
	//�G�ꂽ���̂̃p�[�c�ԍ��́uPartsObject�v�ɁA�w�i�̃p�[�c�ԍ��́uPartsMap�v�Ɋi�[����܂��B
	//�A���I�ȃC�x���g���N�������ꍇ�͂��̂��тɌĂяo����܂��B
	//�c�[�����Ŏw�肵�����e������ɂ����炪���s����܂��B
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	if( Mode == 0 ){
		//�g�p����ϐ��̒�`
		int i;
		int Xp = 0;
		int Yp = 0;
		boolean bFlag = false;
		
		////////////////////////////////////////////////////////////////////////
		//�v���[���[�����̔ԍ��P�O�iPartsObject=10�j�ɐG�����Ƃ��Ɏ��s���܂��i�v���[���[�̍��W��\�����܂��j
		if( PartsObject == 10 ){
			ReturnMessage = "���݂̂��Ȃ��̂�����W�́A\n�w���W��" +PlayerX +"\n�x���W��" +PlayerY +"\n�ł��B\n���̂�����W�́A\n�w���W��" +PartsX +"\n�x���W��" +PartsY +"\n�ł��B";
		}
		////////////////////////////////////////////////////////////////////////
		//�X�e�[�^�X�̕ω��ƕ\��
		if( PartsObject == 11 ){
			Strength = Strength * 2;
			Defence = Defence / 2;
			ReturnMessage = "�v���[���[�̍U���͂��Q�{�ɂ��āA�h��͂𔼕��ɂ��܂��B<p>���̌��ʂ��Ȃ��̃X�e�[�^�X�́A\n";
			ReturnMessage = ReturnMessage +"�����́�" +Energy +"\n�U���́�" +Strength +"\n�h��́�" +Defence +"\n��������" +Gold +"\n�ړ��񐔁�" +Step +"\n�ɂȂ�܂����B";
		}
		//���Ȃ��͐������������Ă��܂��B
		////////////////////////////////////////////////////////////////////////
		//�Ԃ̏�i�w�i�ԍ��R�j������ʂ�������\�����܂��iMode=1�̕����ŉ��Z�������Ă��܂��j
		if( PartsObject == 12 ){
			ReturnMessage = "���Ȃ��͉Ԃ̏��" +Valiable[5] +"��ʂ�܂����B";
		}
		////////////////////////////////////////////////////////////////////////
		//���������Z�C�x���g�̃t���O�𗧂Ă܂��B
		if( PartsObject == 13 ){
			Valiable[6] = 1;
		}
		////////////////////////////////////////////////////////////////////////
		//�}�b�v�̂ǂ��Ɏw��̕��́i���̔ԍ��P�T�̉��F�����j�����݂��邩�\�����܂��B
		if( PartsObject == 14 ){
			//MapWidth�i�}�b�v���j�̉񐔂����AObject[Yp][Xp]�i���̃f�[�^�i�[�z��j�𑖍����܂�
			for( Xp = 0 ; Xp < MapWidth ; ++Xp ){
				for( Yp = 0 ; Yp < MapWidth ; ++Yp ){
					//�w��̂w���W�A�x���W�̂Ƃ���ɕ��̔ԍ��P�T������΃t���O�𗧂Ăă��[�v�𔲂���
					if( Object[Yp][Xp] == 15 ){
						bFlag = true;
						break;
					}
				}
				if( bFlag == true ) break;
			}
			//�t���O�������Ă���΍��W��\��
			ReturnMessage = "�}�b�v�̂ǂ��ɉ��F�����A\n���̔ԍ��P�T�����邩�T���܂��B<p>";
			if( bFlag == true ){
				ReturnMessage = ReturnMessage +"�w���W��" +Xp +"\n�x���W��" +Yp +"\n�ɉ��F�����𔭌����܂����I";
			} else {
				ReturnMessage = ReturnMessage +"���F�����͌�����܂���ł����B";
			}
			//System.out.println( "TEST=" +Xp +" " +Yp );
		}
		////////////////////////////////////////////////////////////////////////
		//�摜��]�����C�x���g�̃t���O�𗧂Ă܂��B
		if( PartsObject == 16 ){
			Valiable[8] = 1;
			Valiable[7] = 0;
		}
		////////////////////////////////////////////////////////////////////////
		if( PartsObject == 20 ){
			ReturnMessage = "��قǃ}�E�X�̉����ꂽ���W�́A\n�w���W��" +Valiable[1] +"\n�x���W��" +Valiable[2] +"\n�����ꂽ�L�[�́A" +Valiable[3] +" �ł��B";
		}
		////////////////////////////////////////////////////////////////////////
		//�����𖞂������ꍇ�ɂ̂݃p�[�c���Őݒ肳�ꂽ���e�����s���܂��B
		//�Ǝ��̏�������}�N������������Ƃ��ȂǂɎg�p���Ă��������B
		if( PartsObject == 21 ){
			for( i = 0 ; i < 12 ; ++i ){
				//�p�[�c�ԍ��P�V�̃A�C�e���������Ă����ꍇ
				if( ItemBox[i] == 17 ) break;
			}
			//�p�[�c�ԍ��P�V�̃A�C�e���������Ă��Ȃ���΁AbNoExec���w�肵�ăp�[�c�ɐݒ肳�ꂽ���e�����s���Ȃ��B
			if( i == 12 ) bNoExec = true;
		}
		////////////////////////////////////////////////////////////////////////
		//�}�E�X�C�x���g�̃t���O�𗧂Ă܂��B
		if( PartsObject == 22 ){
			Valiable[10] = 1;
		}
		////////////////////////////////////////////////////////////////////////
		//�A�j���[�V�����C�x���g�̃t���O�𗧂ĂďI������܂œ��͂𖳌������܂��B
		if( PartsObject == 23 ){
			bAnimeFlag = true;
			iAnimeCount = 0;
			//���͖�����
			bStopInput = true;
		}
		/////////////////////////////////////////////////////////////////////////
	}
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//�uMode=1�v���̏������̒��̓v���[���[���P���ړ����邽�тɌĂяo����܂��B
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	if( Mode == 1 ){
		////////////////////////////////////////////////////////////////////////
		//�v���[���[���Ԃ̏�i�w�i�ԍ��R�j���P��ʂ邽�тɕϐ��z��T���P���Z���܂��B
		if( PartsMap == 3 ) ++Valiable[5];
	}
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//�uMode=2�v���̏������̒��̓}�E�X��L�[��������邽�тɌĂяo����܂��B
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	if( Mode == 2 ){
		////////////////////////////////////////////////////////////////////////
		//�}�E�X�̉����ꂽ���W��ϐ��P�ƂQ�ɉ����ꂽ�L�[��ϐ��z��R�Ɋi�[
		if( MouseX != 0 ) Valiable[1] = MouseX;
		if( MouseY != 0 ) Valiable[2] = MouseY;
		if( Key != 0 ) Valiable[3] = Key;
		////////////////////////////////////////////////////////////////////////
		//�w��ʒu�i�w�x���W�S�O�`�P�Q�O�j�Ń}�E�X�{�^���������ꂽ��C�x���g���N�����܂��B
		//���b�Z�[�W���N���A���邽�߂̃}�E�X�N���b�N�ł����肪�����Ȃ��Ă��܂��܂��̂ŁA
		//�t���O�ubMouseSkip�v�����̊g���N���X���Œ�`���ĂP�񕪁A�}�E�X��L�[�̓��͔�����X�L�b�v���܂��B
		//�ϐ��z��P�O�̃t���O�������Ă���Δ��肵�܂��B
		if( (Valiable[10] == 1) && (MouseX > 40) && (MouseX < 120) && (MouseY > 40) && (MouseY < 120) && (bMouseSkip == false) ){
			ReturnMessage = "�}�E�X�̉����ꂽ���W�́A\n�w���W��" +Valiable[1] +"\n�x���W��" +Valiable[2] +" �ł��B";
			bMouseSkip = true;
		} else {
			bMouseSkip = false;
		}
	}
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//�uMode=3�v���̏������̒��͉�ʂ��P��`�悳��邽�сi�ʏ�P�b�ɂT�O��j�ɌĂяo����܂��B
	//�摜�֘A�̏����͂����ł����Ȃ��Ă��������B
	//�����`�惂�[�h�ł͐���ɋ@�\���܂���̂ŁubPaintAll=true�v�ŋ����I�ɑS��ʕ`�惂�[�h�ɂ��邱�Ƃ��K�v�ł��B
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	if( Mode == 3 ){
		////////////////////////////////////////////////////////////////////////
		//�t���O�������Ă���Ώ��������Z���X�^�[�g���܂��B
		if( (Gold < 1000) && (Valiable[6] == 1) ) ++Gold;
		////////////////////////////////////////////////////////////////////////
		//�摜��]����
		if( (Valiable[8] == 1) && (Valiable[7] < 1000) ){
			++Valiable[7];
			//�p�x�ƍ��W�v�Z
			double dAngle = Valiable[7] * 0.0314 * 5;
			int iX = 200 +(int)(100 *Math.sin(dAngle));
			int iY = 200 +(int)(100 *Math.cos(dAngle));
			//�`��
			bPaintAll = true;
			GrMap.drawImage( ImgCrop[23], iX, iY, null );
		}
		////////////////////////////////////////////////////////////////////////
		//�A�j���[�V�������I������܂œ��͂𖳌������܂��B
		if( bAnimeFlag == true ){
			++iAnimeCount;
			//�A�j���[�V�����I��
			if( iAnimeCount > 200 ){
				bStopInput = false;
				bAnimeFlag = false;
			}
			//�`��
			bPaintAll = true;
			GrMap.drawImage( ImgCrop[23], iAnimeCount *2, iAnimeCount *2, null );
		}
	}
	//�uMode=4�v�V�X�e���̗����グ����CopyRight���Q�Ƃɂ��邽�߂ɌĂяo����܂��B

	////////////////////////////////////////////////////////////////////////////////////////////////
	// �����C���v���O�����͂����܂ŁB
	////////////////////////////////////////////////////////////////////////////////////////////////

	//�g���N���X�Ăяo��
	//WWA wwa = new WWA();
	WWAextend wwa = new WWAextend();
	wwa.ReturnExtend(
		Mode, PlayerX, PlayerY, PlayerDirect,
		Energy, EnergyMax, Strength, Defence, Gold, Step, TimerCount,
		GameoverX, GameoverY, ImgChara, ImgButton, bSaveStop, bDefault, bPaintAll, bStopInput, bAnmItem, MusicNumber,
		ImgEnergy, ImgStrength, ImgDefence, ImgGold, ImgBom, ImgStatusFrame, ImgItemFrame, ImgMainFrame, ImgClickItem,
		ItemBox, Valiable,
		Map, Object,
		ReturnMessage, CopyRight, bReset, bNoExec,
		AtrMap, AtrObject,
		GlobalMessage, SystemMessage
	);
}
}


////////////////////////////////////////////////////////////////////////////////////////////////
// �v���O�����ԐM�p
// ���̂܂܃R���p�C������Ƃv�v�`�{�̂́uWWAextend.class�v��
//�����ɏ㏑������Ē��g�̂Ȃ��t�@�C���ɂȂ�܂��i�t�@�C���T�C�Y���m�F�j�̂ŁA
// �uWWAextend.class�v�̓t�@�C���̃v���p�e�B�ŏ㏑���֎~�ɂ��Ă��܂��Ă��������B
//class WWA {
class WWAextend {
public static void ReturnExtend(
		int Mode, int PlayerX, int PlayerY, char PlayerDirect,
		int Energy, int EnergyMax, int Strength, int Defence, int Gold, int Step, int TimerCount,
		int GameoverX, int GameoverY, int ImgChara, int ImgButton, int bSaveStop, int bDefault, boolean bPaintAll, boolean bStopInput, int bAnmItem, int MusicNumber,
		int ImgEnergy, int ImgStrength, int ImgDefence, int ImgGold, int ImgBom, int ImgStatusFrame, int ImgItemFrame, int ImgMainFrame, int ImgClickItem,
		int ItemBox[], int Valiable[],
		short Map[][], short Object[][],
		String ReturnMessage, String CopyRight, boolean bReset, boolean bNoExec,
		int AtrMap[][], int AtrObject[][],
		String GlobalMessage[], String SystemMessage[]
){}
}

